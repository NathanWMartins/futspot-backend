import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAgendamentoDto } from "../classes/dto/agendamento/create-agendamento.dto";
import { Agendamento, StatusAgendamento } from "src/classes/entity/agendamento.entity";
import { Local } from "src/classes/entity/local.entity";
import { HorarioFuncionamento } from "src/classes/entity/horario-funcionamento.entity";

function timeToMinutes(t: string) {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm;
}
function minutesToTime(m: number) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function diaSemanaFromYYYYMMDD(date: string): number {
    const [y, mo, d] = date.split("-").map(Number);
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
    status: "confirmado" | "cancelado";
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

    ) { }

    async criarAgendamento(jogadorId: number, dto: CreateAgendamentoDto) {
        const local = await this.localRepo.findOne({ where: { id: dto.localId } });
        if (!local) throw new NotFoundException("Local não encontrado.");

        const diaSemana = diaSemanaFromYYYYMMDD(dto.data);
        const horario = await this.horarioRepo.findOne({
            where: { localId: dto.localId, diaSemana },
        });

        if (!horario || !horario.aberto) {
            throw new BadRequestException("Local fechado neste dia.");
        }

        const inicio = dto.inicio.slice(0, 5);

        const inicioMin = timeToMinutes(inicio);
        const fimMin = inicioMin + 60;
        const fim = minutesToTime(fimMin);

        const rangeStart = timeToMinutes(horario.inicio ?? "00:00");
        const rangeEnd = timeToMinutes(horario.fim ?? "00:00");
        if (!(inicioMin >= rangeStart && fimMin <= rangeEnd)) {
            throw new BadRequestException("Horário fora do funcionamento do local.");
        }

        const existing = await this.agRepo.findOne({
            where: {
                localId: dto.localId,
                data: dto.data,
                inicio: inicio,
                status: StatusAgendamento.CONFIRMADO,
            },
        });
        if (existing) throw new ConflictException("Horário já reservado.");

        const ag = this.agRepo.create({
            localId: dto.localId,
            jogadorId,
            data: dto.data,
            inicio: inicio,
            status: StatusAgendamento.CONFIRMADO,
            valorPagar: local.precoHora
        });

        try {
            return await this.agRepo.save(ag);
        } catch (e: any) {
            if (e?.code === "23505") {
                throw new ConflictException("Horário já reservado.");
            }
            throw e;
        }

    }

    async cancelarAgendamento(userId: number, agendamentoId: number) {
        const ag = await this.agRepo.findOne({ where: { id: agendamentoId } });
        if (!ag) throw new NotFoundException("Agendamento não encontrado.");

        // regra simples: só o jogador que criou pode cancelar (pode ampliar depois)
        if (ag.jogadorId !== userId && ag.local.donoId !== userId) {
            throw new ForbiddenException("Você não pode cancelar este agendamento.");
        }

        ag.status = StatusAgendamento.CANCELADO;
        return this.agRepo.save(ag);
    }

    async listarPorLocalEData(localId: number, data: string) {
        return this.agRepo.find({
            where: { localId, data, status: StatusAgendamento.CONFIRMADO },
            relations: { jogador: true },
            order: { inicio: "ASC" as any },
        });
    }

    async disponibilidade(localId: number, data: string) {
        const local = await this.localRepo.findOne({ where: { id: localId } });
        if (!local) throw new NotFoundException("Local não encontrado.");

        const diaSemana = diaSemanaFromYYYYMMDD(data);

        const horario = await this.horarioRepo.findOne({
            where: { localId, diaSemana },
        });

        if (!horario || !horario.aberto) {
            return { fechado: true, slots: [] as any[] };
        }

        const start = timeToMinutes(horario.inicio ?? "00:00");
        const end = timeToMinutes(horario.fim ?? "00:00");

        const ags = await this.listarPorLocalEData(localId, data);
        const ocupadosMap = new Map(ags.map((a) => [a.inicio, a]));

        const slots: {
            inicio: string;
            fim: string;
            status: "livre" | "ocupado";
            agendamentoId?: number;
            jogador?: { id: number; nome: string; email: string };
        }[] = [];

        for (let t = start; t + 60 <= end; t += 60) {
            const inicio = minutesToTime(t);
            const fim = minutesToTime(t + 60);

            const ag = ocupadosMap.get(inicio);

            if (ag) {
                slots.push({
                    inicio,
                    fim,
                    status: "ocupado",
                    agendamentoId: ag.id,
                    jogador: ag.jogador
                        ? { id: ag.jogador.id, nome: ag.jogador.nome, email: ag.jogador.email }
                        : undefined,
                });
            } else {
                slots.push({
                    inicio,
                    fim,
                    status: "livre",
                });
            }
        }

        return { fechado: false, slots };
    }

    //Jogador
    async getMinhaAgenda(jogadorId: number) {
        const rows = await this.agRepo
            .createQueryBuilder("ag")
            .innerJoin("locais", "l", "l.id = ag.localId")
            .leftJoin("avaliacoes_locais", "av", "av.agendamentoId = ag.id")
            .where("ag.jogadorId = :jogadorId", { jogadorId })
            .select([
                "ag.id as id",
                "ag.localId as localId",
                "ag.data as data",
                "ag.inicio as inicio",
                "ag.status as status",

                "l.nome as localNome",
                "l.endereco as endereco",
                "l.fotos as fotos",

                `av.id as "avaliacaoId"`,
                `av.nota as "avaliacaoNota"`,
                `av.comentario as "avaliacaoComentario"`,
            ])
            .addSelect(
                `CASE 
                    WHEN ((ag.data::timestamp + ag.inicio) AT TIME ZONE 'America/Sao_Paulo') >= NOW()
                    THEN true ELSE false END`,
                "isFuturo"
            )
            .addSelect(
                `CASE 
                    WHEN ag.status = '${StatusAgendamento.CONFIRMADO}'
                    AND ((ag.data::timestamp + ag.inicio) AT TIME ZONE 'America/Sao_Paulo') < NOW()
                    AND av.id IS NULL
                    THEN true ELSE false END`,
                "podeAvaliar"
            )
            .orderBy("ag.data", "DESC")
            .addOrderBy("ag.inicio", "DESC")
            .getRawMany();

        const cards: (AgendamentoCardDTO & { isFuturo: boolean })[] = rows.map((r: any) => {
            const inicioHHMM = String(r.inicio).slice(0, 5);

            let fotos: string[] = [];
            if (Array.isArray(r.fotos)) fotos = r.fotos;
            else if (typeof r.fotos === "string" && r.fotos.startsWith("{") && r.fotos.endsWith("}")) {
                fotos = r.fotos
                    .slice(1, -1)
                    .split(",")
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
                podeAvaliar: r.podeAvaliar === true || r.podeAvaliar === "true",
                avaliacao,
                isFuturo: r.isFuturo === true || r.isFuturo === "true",
            };
        });

        const proximos = cards
            .filter((c) => c.status === StatusAgendamento.CONFIRMADO && c.isFuturo)
            .sort((a, b) => (a.data + a.inicio).localeCompare(b.data + b.inicio)) // crescente

        const historico = cards
            .filter((c) => c.status === StatusAgendamento.CANCELADO || !c.isFuturo)
            .sort((a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio)); // decrescente

        return {
            proximos: proximos.map(({ isFuturo, ...rest }) => rest),
            historico: historico.map(({ isFuturo, ...rest }) => rest),
        };
    }
}
