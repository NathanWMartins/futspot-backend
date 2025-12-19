import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HorarioFuncionamento } from "src/classes/entity/horario-funcionamento.entity";
import { Local } from "src/classes/entity/local.entity";
import { LocalController } from "src/controller/local.controller";
import { LocalService } from "src/service/local.service";
import { AgendamentosModule } from "./agendamentos.module";

@Module({
    imports: [TypeOrmModule.forFeature([Local, HorarioFuncionamento]), AgendamentosModule],
    controllers: [LocalController],
    providers: [LocalService],
})
export class LocalModule { }
