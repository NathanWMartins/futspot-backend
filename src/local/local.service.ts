import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLocalDto } from 'src/local/dto/create-local.dto';
import { UpdateLocalDto } from 'src/local/dto/update-local.dto';
import {
  Agendamento,
  StatusAgendamento,
} from 'src/agendamentos/agendamento.entity';
import { HorarioFuncionamento } from 'src/agendamentos/horario-funcionamento.entity';
import { Local } from 'src/local/local.entity';
import {
  buildHourlySlots,
  filterByPeriodos,
  hhmmParaMinutos,
  hojeYYYYMMDDLocal,
  minutosAgoraLocal,
  normalizeHHMM,
} from 'src/utils/date-time';
import { In, Repository } from 'typeorm';

@Injectable()
export class LocalService {
  constructor(
    @InjectRepository(Local)
    private readonly localRepository: Repository<Local>,

    @InjectRepository(HorarioFuncionamento)
    private readonly horarioRepo: Repository<HorarioFuncionamento>,

    @InjectRepository(Agendamento)
    private readonly agendamentoRepository: Repository<Agendamento>,
  ) {}

  async listarPorDono(donoId: number) {
    return this.localRepository.find({
      where: { donoId },
      order: { createdAt: 'DESC' },
    });
  }

  async criar(donoId: number, dto: CreateLocalDto) {
    const local = this.localRepository.create({
      nome: dto.nome,
      descricao: dto.descricao,
      cep: dto.cep,
      cidade: dto.cidade,
      endereco: dto.endereco,
      numero: dto.numero,
      tipoLocal: dto.tipoLocal,
      precoHora: dto.precoHora,
      fotos: dto.fotos ?? [],
      donoId,
    });

    return this.localRepository.save(local);
  }

  async atualizar(donoId: number, localId: number, dto: UpdateLocalDto) {
    const local = await this.localRepository.findOne({
      where: { id: localId },
      relations: { horarios: true },
    });

    if (!local) throw new NotFoundException('Local não encontrado.');
    if (local.donoId !== donoId)
      throw new ForbiddenException('Você não pode editar este local.');

    local.nome = dto.nome ?? local.nome;
    local.descricao = dto.descricao ?? local.descricao;
    local.cep = dto.cep ?? local.cep;
    local.cidade = dto.cidade ?? local.cidade;
    local.endereco = dto.endereco ?? local.endereco;
    local.numero = dto.numero ?? local.numero;
    local.tipoLocal = dto.tipoLocal ?? local.tipoLocal;
    local.precoHora = dto.precoHora ?? local.precoHora;
    local.fotos = dto.fotos ?? local.fotos;

    if (dto.horarios?.length) {
      await this.horarioRepo.delete({ localId });
      local.horarios = dto.horarios.map((h) =>
        this.horarioRepo.create({ ...h, localId }),
      );
    }

    return this.localRepository.save(local);
  }

  async remover(donoId: number, localId: number) {
    const local = await this.localRepository.findOne({
      where: { id: localId },
    });

    if (!local) {
      throw new NotFoundException('Local não encontrado.');
    }

    if (local.donoId !== donoId) {
      throw new ForbiddenException('Você não pode remover este local.');
    }

    await this.localRepository.remove(local);
    return { ok: true };
  }

  //Jogador
  async buscarLocais(filtro: {
    cidade: string;
    data: string;
    tipos: string;
    periodos?: string;
  }) {
    if (filtro.data) {
      const dataSelecionada = new Date(`${filtro.data}T00:00:00`);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      if (isNaN(dataSelecionada.getTime())) {
        throw new BadRequestException('Data inválida');
      }

      if (dataSelecionada < hoje) {
        throw new BadRequestException(
          'A data selecionada já passou.',
        );
      }
    }
    const qb = this.localRepository.createQueryBuilder('local');

    qb.where('local.cidade ILIKE :cidade', { cidade: `%${filtro.cidade}%` });

    if (filtro.tipos) {
      const tiposArray = filtro.tipos.split(',').filter(Boolean);
      if (tiposArray.length)
        qb.andWhere('local.tipoLocal IN (:...tipos)', { tipos: tiposArray });
    }

    qb.leftJoin('avaliacoes_locais', 'av', 'av.localId = local.id');
    qb.addSelect('COALESCE(AVG(av.nota), 0)', 'rating');
    qb.addSelect('COUNT(av.id)', 'totalAvaliacoes');

    qb.groupBy('local.id');
    qb.orderBy('local.createdAt', 'DESC');

    const { entities, raw } = await qb.getRawAndEntities();

    const base = entities.map((local, idx) => ({
      ...local,
      rating: Number(raw[idx]?.rating ?? 0),
      totalAvaliacoes: Number(raw[idx]?.totalAvaliacoes ?? 0),
    }));

    if (!filtro.data) {
      return base.map((l) => ({ ...l, slotsDisponiveis: [] }));
    }

    const diaSemana = new Date(`${filtro.data}T00:00:00`).getDay();

    const localIds = base.map((l) => l.id);
    if (!localIds.length) return [];

    const horariosDoDia = await this.horarioRepo.find({
      where: {
        localId: In(localIds),
        diaSemana,
      },
    });

    const horarioMap = new Map<
      number,
      { aberto: boolean; inicio: string | null; fim: string | null }
    >();
    for (const h of horariosDoDia) {
      horarioMap.set(h.localId, {
        aberto: h.aberto,
        inicio: h.inicio,
        fim: h.fim,
      });
    }

    const agendamentos = await this.agendamentoRepository.find({
      where: {
        localId: In(localIds),
        data: filtro.data,
        status: StatusAgendamento.CONFIRMADO,
      },
      select: ['localId', 'inicio'],
    });

    const ocupadosMap = new Map<number, Set<string>>();
    for (const ag of agendamentos) {
      const hhmm = normalizeHHMM(ag.inicio);
      if (!ocupadosMap.has(ag.localId)) ocupadosMap.set(ag.localId, new Set());
      ocupadosMap.get(ag.localId)!.add(hhmm);
    }

    return base.map((local) => {
      const hf = horarioMap.get(local.id);

      let slots: string[] = [];
      if (hf?.aberto && hf.inicio && hf.fim) {
        slots = buildHourlySlots(hf.inicio, hf.fim);

        const ocupados = ocupadosMap.get(local.id);
        if (ocupados?.size) {
          slots = slots.filter((s) => !ocupados.has(s));
        }

        slots = filterByPeriodos(slots, filtro.periodos);
      }

      return {
        ...local,
        horarios: slots,
      };
    });
  }

  async getDisponibilidadePorData(localId: number, data: string) {
    const local = await this.localRepository.findOne({
      where: { id: localId },
    });
    if (!local) throw new NotFoundException('Local não encontrado.');

    const [y, m, d] = data.split('-').map(Number);
    const diaSemana = new Date(y, m - 1, d).getDay();

    const hf = await this.horarioRepo.findOne({
      where: { localId, diaSemana },
    });

    if (!hf || !hf.aberto || !hf.inicio || !hf.fim) {
      return { localId, data, slotsDisponiveis: [] as string[] };
    }

    let slots = buildHourlySlots(hf.inicio, hf.fim);

    const ags = await this.agendamentoRepository.find({
      where: { localId, data, status: StatusAgendamento.CONFIRMADO },
      select: ['inicio'],
    });

    const ocupados = new Set(ags.map((a) => normalizeHHMM(a.inicio)));
    slots = slots.filter((s) => !ocupados.has(s));

    const hoje = hojeYYYYMMDDLocal();

    if (data === hoje) {
      const agoraMin = minutosAgoraLocal();

      slots = slots.filter((slot) => {
        const slotMin = hhmmParaMinutos(slot);
        return slotMin > agoraMin;
      });
    }

    return { localId, data, slotsDisponiveis: slots };
  }
}
