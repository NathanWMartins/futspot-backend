import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgendamentosController } from "src/agendamentos/agendamentos.controller";
import { AgendamentosService } from "src/agendamentos/agendamentos.service";
import { Agendamento } from "src/classes/entity/agendamento.entity";
import { HorarioFuncionamento } from "src/classes/entity/horario-funcionamento.entity";
import { Local } from "src/classes/entity/local.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Agendamento, Local, HorarioFuncionamento])],
    controllers: [AgendamentosController],
    providers: [AgendamentosService],
    exports: [AgendamentosService],
})
export class AgendamentosModule { }
