import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Agendamento } from "src/agendamentos/agendamento.entity";
import { AvaliacaoLocal } from "src/avaliacao/avaliacao-local.entity";
import { AvaliacaoController } from "src/avaliacao/avaliacao.controller";
import { AvaliacaoService } from "src/avaliacao/avaliacao.service";

@Module({
  imports: [TypeOrmModule.forFeature([AvaliacaoLocal, Agendamento])],
  controllers: [AvaliacaoController],
  providers: [AvaliacaoService],
  exports: [AvaliacaoService],
})
export class AvaliacaoModule {}
