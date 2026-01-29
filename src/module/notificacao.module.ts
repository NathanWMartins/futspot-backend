import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Agendamento } from "src/agendamentos/agendamento.entity";
import { NotificacaoController } from "src/notificacao/notificacao.controller";
import { Notificacao } from "src/notificacao/notificacao.entity";
import { NotificacaoService } from "src/notificacao/notificacao.service";

@Module({
  imports: [TypeOrmModule.forFeature([Notificacao, Agendamento])],
  controllers: [NotificacaoController],
  providers: [NotificacaoService],
  exports: [NotificacaoService],
})
export class NotificacaoModule {}
