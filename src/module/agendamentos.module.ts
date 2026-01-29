import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AgendamentosController } from "src/agendamentos/agendamentos.controller";
import { AgendamentosService } from "src/agendamentos/agendamentos.service";
import { Agendamento } from "src/agendamentos/agendamento.entity";
import { HorarioFuncionamento } from "src/agendamentos/horario-funcionamento.entity";
import { Local } from "src/local/local.entity";
import { User } from "src/user/user.entity";
import { Notificacao } from "src/notificacao/notificacao.entity";
import { NotificacaoService } from "src/notificacao/notificacao.service";

@Module({
    imports: [TypeOrmModule.forFeature([Agendamento, Local, HorarioFuncionamento, User, Notificacao])],
    controllers: [AgendamentosController],
    providers: [AgendamentosService, NotificacaoService],
    exports: [AgendamentosService, NotificacaoService],
})
export class AgendamentosModule { }
