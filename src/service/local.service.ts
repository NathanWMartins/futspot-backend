import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateLocalDto } from "src/classes/dto/local/create-local.dto";
import { UpdateLocalDto } from "src/classes/dto/local/update-local.dto";
import { HorarioFuncionamento } from "src/classes/entity/horario-funcionamento.entity";
import { Local } from "src/classes/entity/local.entity";
import { Repository } from "typeorm";

@Injectable()
export class LocalService {
    constructor(
        @InjectRepository(Local)
        private readonly localRepository: Repository<Local>,

        @InjectRepository(HorarioFuncionamento)
        private readonly horarioRepo: Repository<HorarioFuncionamento>,
    ) { }

    async listarPorDono(donoId: number) {
        return this.localRepository.find({
            where: { donoId },
            order: { createdAt: "DESC" },
        });
    }

    async criar(donoId: number, dto: CreateLocalDto) {
        const local = this.localRepository.create({
            nome: dto.nome,
            descricao: dto.descricao,
            endereco: dto.endereco,
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

        if (!local) throw new NotFoundException("Local não encontrado.");
        if (local.donoId !== donoId) throw new ForbiddenException("Você não pode editar este local.");

        local.nome = dto.nome ?? local.nome;
        local.descricao = dto.descricao ?? local.descricao;
        local.endereco = dto.endereco ?? local.endereco;
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
            throw new NotFoundException("Local não encontrado.");
        }

        if (local.donoId !== donoId) {
            throw new ForbiddenException("Você não pode remover este local.");
        }

        await this.localRepository.remove(local);
        return { ok: true };
    }
}
