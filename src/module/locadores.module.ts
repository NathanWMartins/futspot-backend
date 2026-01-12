import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Agendamento } from "src/classes/entity/agendamento.entity";
import { AvaliacaoLocal } from "src/classes/entity/avaliacao-local.entity";
import { Local } from "src/classes/entity/local.entity";
import { User } from "src/classes/entity/user.entity";
import { LocadoresController } from "src/controller/locadores.controller";
import { LocadoresService } from "src/service/locadores.service";

@Module({
    imports: [TypeOrmModule.forFeature([Local, Agendamento, User, AvaliacaoLocal])],
    controllers: [LocadoresController],
    providers: [LocadoresService],
})
export class LocadoresModule { }
