import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HorarioFuncionamento } from "src/agendamentos/horario-funcionamento.entity";
import { Local } from "src/local/local.entity";
import { LocalController } from "src/local/local.controller";
import { LocalService } from "src/local/local.service";
import { AgendamentosModule } from "./agendamentos.module";
import { Agendamento } from "src/agendamentos/agendamento.entity";
import { User } from "src/user/user.entity";
import { Mensalidade } from "src/mensalidade/mensalidade.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Local, HorarioFuncionamento, Agendamento, User, Mensalidade]), AgendamentosModule],
    controllers: [LocalController],
    providers: [LocalService],
})
export class LocalModule { }
