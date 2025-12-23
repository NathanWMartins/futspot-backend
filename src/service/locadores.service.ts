import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Agendamento, StatusAgendamento } from "src/classes/entity/agendamento.entity";
import { Local } from "src/classes/entity/local.entity";
import { Repository } from "typeorm";

type OcupacaoItem = {
    localId: number;
    fechado: boolean;
    ocupados: number;
    totalSlots: number;
};

type OcupacaoResponse = {
    data: string;
    itens: OcupacaoItem[];
};

@Injectable()
export class LocadoresService {
    constructor(
        @InjectRepository(Local)
        private readonly localRepo: Repository<Local>,

        @InjectRepository(Agendamento)
        private readonly agendamentoRepo: Repository<Agendamento>,
    ) { }

    async ocupacaoDoDia(donoId: number, data: string): Promise<OcupacaoResponse> {
        if (!isValidISODate(data)) {
            throw new BadRequestException("Parâmetro 'data' inválido. Use YYYY-MM-DD.");
        }

        const dow = getDayOfWeek0to6(data);

        const locais = await this.localRepo.find({
            where: { donoId },
            relations: { horarios: true },
            order: { createdAt: "DESC" },
        });

        const ocupadosPorLocal = await this.countOcupadosPorLocal(donoId, data);

        const itens: OcupacaoItem[] = locais.map((local) => {
            const horarioDoDia = (local.horarios ?? []).find((h) => h.diaSemana === dow);

            if (!horarioDoDia || !horarioDoDia.aberto || !horarioDoDia.inicio || !horarioDoDia.fim) {
                return {
                    localId: local.id,
                    fechado: true,
                    ocupados: 0,
                    totalSlots: 0,
                };
            }

            const totalSlots = calcTotalSlots1h(horarioDoDia.inicio, horarioDoDia.fim);

            if (totalSlots <= 0) {
                return {
                    localId: local.id,
                    fechado: false,
                    ocupados: 0,
                    totalSlots: 0,
                };
            }

            const ocupados = ocupadosPorLocal.get(local.id) ?? 0;

            return {
                localId: local.id,
                fechado: false,
                ocupados: Math.min(ocupados, totalSlots),
                totalSlots,
            };
        });

        return { data, itens };
    }

    private async countOcupadosPorLocal(donoId: number, data: string): Promise<Map<number, number>> {
        const rows = await this.agendamentoRepo
            .createQueryBuilder("a")
            .innerJoin(Local, "l", "l.id = a.localId")
            .select("a.localId", "localId")
            .addSelect("COUNT(*)", "ocupados")
            .where("l.donoId = :donoId", { donoId })
            .andWhere("a.data = :data", { data })
            .andWhere("a.status = :status", { status: StatusAgendamento.CONFIRMADO })
            .groupBy("a.localId")
            .getRawMany<{ localId: string; ocupados: string }>();

        const map = new Map<number, number>();
        for (const r of rows) {
            map.set(Number(r.localId), Number(r.ocupados));
        }
        return map;
    }
}

/* Helpers */

function isValidISODate(s: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime());
}

function getDayOfWeek0to6(isoDate: string): number {
    const d = new Date(`${isoDate}T00:00:00Z`);
    return d.getUTCDay();
}

function timeToMinutes(hhmmOrTime: string): number {
    const parts = hhmmOrTime.split(":").map((x) => Number(x));
    const h = parts[0];
    const m = parts[1];
    if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
    return h * 60 + m;
}

function calcTotalSlots1h(inicio: string, fim: string): number {
    const start = timeToMinutes(inicio);
    const end = timeToMinutes(fim);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;

    const diff = end - start;
    if (diff <= 0) return 0;

    return Math.floor(diff / 60);
}
