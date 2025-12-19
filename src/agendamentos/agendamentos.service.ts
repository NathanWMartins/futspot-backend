import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateAgendamentoDto } from "./dto/create-agendamento.dto";
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

        // slot de 1h
        const inicioMin = timeToMinutes(dto.inicio);
        const fimMin = inicioMin + 60;
        const fim = minutesToTime(fimMin);

        // valida dentro do range do local
        const rangeStart = timeToMinutes(horario.inicio ?? "00:00");
        const rangeEnd = timeToMinutes(horario.fim ?? "00:00");
        if (!(inicioMin >= rangeStart && fimMin <= rangeEnd)) {
            throw new BadRequestException("Horário fora do funcionamento do local.");
        }

        // garante que não existe reserva confirmada pro mesmo slot
        const existing = await this.agRepo.findOne({
            where: {
                localId: dto.localId,
                data: dto.data,
                inicio: dto.inicio,
                status: StatusAgendamento.CONFIRMADO,
            },
        });
        if (existing) throw new BadRequestException("Horário já reservado.");

        const ag = this.agRepo.create({
            localId: dto.localId,
            jogadorId,
            data: dto.data,
            inicio: dto.inicio,
            status: StatusAgendamento.CONFIRMADO,
        });

        return this.agRepo.save(ag);
    }

    async cancelarAgendamento(userId: number, agendamentoId: number) {
        const ag = await this.agRepo.findOne({ where: { id: agendamentoId } });
        if (!ag) throw new NotFoundException("Agendamento não encontrado.");

        // regra simples: só o jogador que criou pode cancelar (pode ampliar depois)
        if (ag.jogadorId !== userId) {
            throw new ForbiddenException("Você não pode cancelar este agendamento.");
        }

        ag.status = StatusAgendamento.CANCELADO;
        return this.agRepo.save(ag);
    }

    async listarPorLocalEData(localId: number, data: string) {
        return this.agRepo.find({
            where: { localId, data, status: StatusAgendamento.CONFIRMADO },
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
        const ocupados = new Set(ags.map((a) => a.inicio));

        const slots: { inicio: string; fim: string; status: "livre" | "ocupado" }[] = [];
        for (let t = start; t + 60 <= end; t += 60) {
            const inicio = minutesToTime(t);
            slots.push({
                inicio,
                fim: minutesToTime(t + 60),
                status: ocupados.has(inicio) ? "ocupado" : "livre",
            });
        }

        return { fechado: false, slots };
    }
}
