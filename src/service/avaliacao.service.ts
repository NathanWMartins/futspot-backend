import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateAvaliacaoDto } from "src/classes/dto/agendamento/create-avaliacao.dto";
import { Agendamento, StatusAgendamento } from "src/classes/entity/agendamento.entity";
import { AvaliacaoLocal } from "src/classes/entity/avaliacao-local.entity";
import { Repository } from "typeorm";

@Injectable()
export class AvaliacaoService {
    constructor(
        @InjectRepository(AvaliacaoLocal)
        private readonly avaliacaoRepo: Repository<AvaliacaoLocal>,

        @InjectRepository(Agendamento)
        private readonly agendamentoRepo: Repository<Agendamento>,
    ) { }

    async criar(jogadorId: number, dto: CreateAvaliacaoDto) {
        const ag = await this.agendamentoRepo.findOne({
            where: { id: dto.agendamentoId, jogadorId },
            select: ["id", "localId", "data", "inicio", "status", "jogadorId"],
        });
        if (!ag) throw new NotFoundException("Agendamento não encontrado.");

        if (ag.jogadorId !== jogadorId) {
            throw new ForbiddenException("Você não pode avaliar um agendamento de outro usuário.");
        }
        if (ag.status === StatusAgendamento.CANCELADO) {
            throw new BadRequestException("Agendamentos cancelados não podem ser avaliados.");
        }

        const when = new Date(`${ag.data}T${ag.inicio}:00`);
        if (when.getTime() > Date.now()) {
            throw new BadRequestException("Você só pode avaliar após o horário do agendamento.");
        }

        const exists = await this.avaliacaoRepo.findOne({ where: { agendamentoId: dto.agendamentoId } });
        if (exists) throw new BadRequestException("Este agendamento já foi avaliado.");

        const entity = this.avaliacaoRepo.create({
            localId: ag.localId,
            jogadorId,
            agendamentoId: dto.agendamentoId,
            nota: dto.nota,
            comentario: dto.comentario ?? null,
        });

        return this.avaliacaoRepo.save(entity);
    }
}
