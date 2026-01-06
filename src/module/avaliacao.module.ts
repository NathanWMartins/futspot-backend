import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Agendamento } from "src/classes/entity/agendamento.entity";
import { AvaliacaoLocal } from "src/classes/entity/avaliacao-local.entity";
import { AvaliacaoController } from "src/controller/avaliacao.controller";
import { AvaliacaoService } from "src/service/avaliacao.service";

@Module({
  imports: [TypeOrmModule.forFeature([AvaliacaoLocal, Agendamento])],
  controllers: [AvaliacaoController],
  providers: [AvaliacaoService],
  exports: [AvaliacaoService],
})
export class AvaliacaoModule {}
