import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import {
  Agendamento,
  CanceladoPor,
  StatusAgendamento,
} from 'src/agendamentos/agendamento.entity';
import { Local } from 'src/local/local.entity';
import { HorarioFuncionamento } from 'src/local/horario-funcionamento.entity';
import { NotificacaoService } from 'src/notificacao/notificacao.service';
import { DataSource } from 'typeorm';
import { TipoNotificacao } from 'src/notificacao/enum/notificacao.enum';

function timeToMinutes(t: string) {
  const [hh, mm] = t.split(':').map(Number);
  return hh * 60 + mm;
}
function minutesToTime(m: number) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function diaSemanaFromYYYYMMDD(date: string): number {
  const [y, mo, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCDay();
}

type AgendamentoCardDTO = {
  id: number;
  localId: number;
  localNome: string;
  localFotoUrl?: string | null;
  endereco?: string | null;
  data: string;
  inicio: string;
  status: StatusAgendamento;
  podeAvaliar: boolean;
  avaliacao?: { id: number; nota: number; comentario?: string | null } | null;
};

@Injectable()
export class AgendamentosService {
  constructor(
    @InjectRepository(Agendamento)
    private readonly agRepo: Repository<Agendamento>,

    @InjectRepository(Local)
    private readonly localRepo: Repository<Local>,

    @InjectRepository(HorarioFuncionamento)
    private readonly horarioRepo: Repository<HorarioFuncionamento>,

    private readonly notificacaoService: NotificacaoService,
    private readonly dataSource: DataSource,
  ) {}

  private validarAgendamentoNaoExpirado(ag: Agendamento) {
    if (agendamentoJaPassou(ag.data, ag.inicio)) {
      throw new BadRequestException(
        'Não é possível alterar um agendamento que já ocorreu ou está em andamento.',
      );
    }
  }

  async criarAgendamento(jogadorId: number, dto: CreateAgendamentoDto) {
    const local = await this.localRepo.findOne({ where: { id: dto.localId } });
    if (!local) throw new NotFoundException('Local não encontrado.');

    const diaSemana = diaSemanaFromYYYYMMDD(dto.data);
    const horario = await this.horarioRepo.findOne({
      where: { localId: dto.localId, diaSemana },
    });

    if (!horario || !horario.aberto) {
      throw new BadRequestException('Local fechado neste dia.');
    }

    const inicio = dto.inicio.slice(0, 5);

    const inicioMin = timeToMinutes(inicio);
    const fimMin = inicioMin + 60;

    const rangeStart = timeToMinutes(horario.inicio ?? '00:00');
    const rangeEnd = timeToMinutes(horario.fim ?? '00:00');
    if (!(inicioMin >= rangeStart && fimMin <= rangeEnd)) {
      throw new BadRequestException('Horário fora do funcionamento do local.');
    }

    const existing = await this.agRepo.findOne({
      where: {
        localId: dto.localId,
        data: dto.data,
        inicio: inicio,
        status: StatusAgendamento.CONFIRMADO,
      },
    });
    if (existing) throw new ConflictException('Horário já reservado.');

    try {
      return await this.dataSource.transaction(async (manager) => {
        const agendamento = manager.create(Agendamento, {
          localId: dto.localId,
          jogadorId,
          data: dto.data,
          inicio,
          status: StatusAgendamento.SOLICITADO,
          valorPagar: local.precoHora,
        });

        const agSalvo = await manager.save(agendamento);

        await this.notificacaoService.criar(manager, {
          usuarioId: local.donoId,
          agendamentoId: agSalvo.id,
          tipo: TipoNotificacao.AGENDAMENTO_SOLICITADO,
          titulo: 'Novo pedido de agendamento',
          mensagem: 'Um jogador solicitou o agendamento do seu local',
        });

        return agSalvo;
      });
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new ConflictException('Horário já reservado.');
      }
      throw e;
    }
  }

  async cancelarAgendamento(userId: number, agendamentoId: number) {
    return this.dataSource.transaction(async (manager) => {
      const ag = await manager.findOne(Agendamento, {
        where: { id: agendamentoId },
        relations: ['local'],
      });

      if (!ag) {
        throw new NotFoundException('Agendamento não encontrado.');
      }

      this.validarAgendamentoNaoExpirado(ag);

      if (ag.status === StatusAgendamento.CANCELADO) {
        throw new BadRequestException('Este agendamento já foi cancelado.');
      }

      const isJogador = ag.jogadorId === userId;
      const isDonoLocal = ag.local?.donoId === userId;

      if (!isJogador && !isDonoLocal) {
        throw new ForbiddenException(
          'Você não pode cancelar este agendamento.',
        );
      }

      ag.status = StatusAgendamento.CANCELADO;
      ag.canceladoPor = isJogador
        ? CanceladoPor.JOGADOR
        : CanceladoPor.DONO_QUADRA;

      const agSalvo = await manager.save(ag);

      const usuarioNotificado = isJogador ? ag.local.donoId : ag.jogadorId;

      await this.notificacaoService.criar(manager, {
        usuarioId: usuarioNotificado,
        agendamentoId: agSalvo.id,
        tipo: TipoNotificacao.AGENDAMENTO_CANCELADO,
        titulo: 'Agendamento cancelado',
        mensagem: isJogador
          ? 'O jogador cancelou o agendamento do seu local.'
          : 'O locador cancelou o seu agendamento.',
      });

      return agSalvo;
    });
  }

  async listarPorLocalEData(localId: number, data: string) {
    return this.agRepo.find({
      where: {
        localId,
        data,
        status: In([
          StatusAgendamento.CONFIRMADO,
          StatusAgendamento.SOLICITADO,
        ]),
      },
      relations: { jogador: true },
      order: { inicio: 'ASC' },
    });
  }

  async disponibilidade(localId: number, data: string) {
    const local = await this.localRepo.findOne({ where: { id: localId } });
    if (!local) throw new NotFoundException('Local não encontrado.');

    const diaSemana = diaSemanaFromYYYYMMDD(data);

    const horario = await this.horarioRepo.findOne({
      where: { localId, diaSemana },
    });

    if (!horario || !horario.aberto) {
      return { fechado: true, slots: [] as any[] };
    }

    const start = timeToMinutes(horario.inicio ?? '00:00');
    const end = timeToMinutes(horario.fim ?? '00:00');

    const ags = await this.listarPorLocalEData(localId, data);
    const ocupadosMap = new Map(ags.map((a) => [a.inicio.slice(0, 5), a]));

    const slots: {
      inicio: string;
      fim: string;
      status: 'livre' | 'ocupado' | 'solicitado';
      agendamentoId?: number;
      jogador?: { id: number; nome: string; email: string; fotoUrl?: string };
    }[] = [];

    for (let t = start; t + 60 <= end; t += 60) {
      const inicio = minutesToTime(t);
      const fim = minutesToTime(t + 60);

      const ag = ocupadosMap.get(inicio);

      if (!ag) {
        slots.push({
          inicio,
          fim,
          status: 'livre',
        });
        continue;
      }

      const status =
        ag.status === StatusAgendamento.CONFIRMADO
          ? 'ocupado'
          : ag.status === StatusAgendamento.SOLICITADO
            ? 'solicitado'
            : 'livre';

      slots.push({
        inicio,
        fim,
        status,
        agendamentoId: ag.id,
        jogador: ag.jogador
          ? {
              id: ag.jogador.id,
              nome: ag.jogador.nome,
              email: ag.jogador.email,
              fotoUrl: ag.jogador.fotoUrl,
            }
          : undefined,
      });
    }

    return { fechado: false, slots };
  }

  async confirmarAgendamento(userId: number, agendamentoId: number) {
    return this.dataSource.transaction(async (manager) => {
      const agendamento = await manager.findOne(Agendamento, {
        where: { id: agendamentoId },
        relations: { local: true },
      });

      if (!agendamento) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      this.validarAgendamentoNaoExpirado(agendamento);

      if (agendamento.status !== StatusAgendamento.SOLICITADO) {
        throw new BadRequestException('Agendamento não está pendente');
      }

      if (agendamento.local.donoId !== userId) {
        throw new ForbiddenException(
          'Você não pode confirmar este agendamento',
        );
      }

      agendamento.status = StatusAgendamento.CONFIRMADO;

      const agSalvo = await manager.save(agendamento);

      await this.notificacaoService.criar(manager, {
        usuarioId: agSalvo.jogadorId,
        agendamentoId: agSalvo.id,
        tipo: TipoNotificacao.AGENDAMENTO_ACEITO,
        titulo: 'Agendamento confirmado',
        mensagem: 'Seu agendamento foi confirmado pelo locador.',
      });

      return agSalvo;
    });
  }

  async recusarAgendamento(userId: number, agendamentoId: number) {
    return this.dataSource.transaction(async (manager) => {
      const agendamento = await manager.findOne(Agendamento, {
        where: { id: agendamentoId },
        relations: { local: true },
      });

      if (!agendamento) {
        throw new NotFoundException('Agendamento não encontrado');
      }

      this.validarAgendamentoNaoExpirado(agendamento);

      if (agendamento.status !== StatusAgendamento.SOLICITADO) {
        throw new BadRequestException('Agendamento não está pendente');
      }

      if (agendamento.local.donoId !== userId) {
        throw new ForbiddenException('Você não pode recusar este agendamento');
      }

      agendamento.status = StatusAgendamento.RECUSADO;

      const agSalvo = await manager.save(agendamento);

      await this.notificacaoService.criar(manager, {
        usuarioId: agSalvo.jogadorId,
        agendamentoId: agSalvo.id,
        tipo: TipoNotificacao.AGENDAMENTO_RECUSADO,
        titulo: 'Agendamento recusado',
        mensagem: 'O dono do local recusou seu pedido de agendamento.',
      });

      return agSalvo;
    });
  }

  //Jogador
  async getMinhaAgenda(jogadorId: number) {
    const rows = await this.agRepo
      .createQueryBuilder('ag')
      .innerJoin('locais', 'l', 'l.id = ag.localId')
      .leftJoin('avaliacoes_locais', 'av', 'av.agendamentoId = ag.id')
      .where('ag.jogadorId = :jogadorId', { jogadorId })
      .select([
        'ag.id as id',
        'ag.localId as localId',
        'ag.data as data',
        'ag.inicio as inicio',
        'ag.status as status',

        'l.nome as localNome',
        'l.endereco as endereco',
        'l.fotos as fotos',

        `av.id as "avaliacaoId"`,
        `av.nota as "avaliacaoNota"`,
        `av.comentario as "avaliacaoComentario"`,
      ])
      .addSelect(
        `CASE 
                    WHEN ((ag.data::timestamp + ag.inicio) AT TIME ZONE 'America/Sao_Paulo') >= NOW()
                    THEN true ELSE false END`,
        'isFuturo',
      )
      .addSelect(
        `CASE 
                    WHEN ag.status = '${StatusAgendamento.CONFIRMADO}'
                    AND ((ag.data::timestamp + ag.inicio) AT TIME ZONE 'America/Sao_Paulo') < NOW()
                    AND av.id IS NULL
                    THEN true ELSE false END`,
        'podeAvaliar',
      )
      .orderBy('ag.data', 'DESC')
      .addOrderBy('ag.inicio', 'DESC')
      .getRawMany();

    const cards: (AgendamentoCardDTO & { isFuturo: boolean })[] = rows.map(
      (r: any) => {
        const inicioHHMM = String(r.inicio).slice(0, 5);

        let fotos: string[] = [];
        if (Array.isArray(r.fotos)) fotos = r.fotos;
        else if (
          typeof r.fotos === 'string' &&
          r.fotos.startsWith('{') &&
          r.fotos.endsWith('}')
        ) {
          fotos = r.fotos
            .slice(1, -1)
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
        }

        const avaliacao =
          r.avaliacaoId != null
            ? {
                id: Number(r.avaliacaoId),
                nota: Number(r.avaliacaoNota),
                comentario: r.avaliacaoComentario ?? null,
              }
            : null;

        return {
          id: Number(r.id),
          localId: Number(r.localId),
          localNome: r.localnome,
          localFotoUrl: fotos?.[0] ?? null,
          endereco: r.endereco ?? null,
          data: r.data,
          inicio: inicioHHMM,
          status: r.status,
          podeAvaliar: r.podeAvaliar === true || r.podeAvaliar === 'true',
          avaliacao,
          isFuturo: r.isFuturo === true || r.isFuturo === 'true',
        };
      },
    );

    const proximos = cards
      .filter(
        (c) =>
          c.isFuturo &&
          (c.status === StatusAgendamento.CONFIRMADO ||
            c.status === StatusAgendamento.SOLICITADO),
      )
      .sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio));

    const historico = cards
      .filter((c) => c.status === StatusAgendamento.CANCELADO || !c.isFuturo)
      .sort((a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio));

    return {
      proximos: proximos.map(({ isFuturo, ...rest }) => rest),
      historico: historico.map(({ isFuturo, ...rest }) => rest),
    };
  }
}

function agendamentoJaPassou(data: string, inicio: string): boolean {
  const [ano, mes, dia] = data.split('-').map(Number);
  const [hora, minuto] = inicio.split(':').map(Number);

  const dataAgendamento = new Date(ano, mes - 1, dia, hora, minuto);
  const agora = new Date();

  return dataAgendamento <= agora;
}
