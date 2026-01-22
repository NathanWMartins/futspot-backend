import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgendamentosController } from "src/agendamentos/agendamentos.controller";
import { AgendamentosService } from "src/agendamentos/agendamentos.service";
import { Agendamento } from "src/agendamentos/agendamento.entity";
import { HorarioFuncionamento } from "src/agendamentos/horario-funcionamento.entity";
import { Local } from "src/local/local.entity";
import { User } from "src/user/user.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Agendamento, Local, HorarioFuncionamento, User])],
    controllers: [AgendamentosController],
    providers: [AgendamentosService],
    exports: [AgendamentosService],
})
export class AgendamentosModule { }
