import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Agendamento } from "src/agendamentos/agendamento.entity";
import { AvaliacaoLocal } from "src/avaliacao/avaliacao-local.entity";
import { Local } from "src/local/local.entity";
import { User } from "src/user/user.entity";
import { LocadoresController } from "src/locadores/locadores.controller";
import { LocadoresService } from "src/locadores/locadores.service";

@Module({
    imports: [TypeOrmModule.forFeature([Local, Agendamento, User, AvaliacaoLocal])],
    controllers: [LocadoresController],
    providers: [LocadoresService],
})
export class LocadoresModule { }
