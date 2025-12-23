import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Agendamento } from "src/classes/entity/agendamento.entity";
import { Local } from "src/classes/entity/local.entity";
import { LocadoresController } from "src/controller/locadores.controller";
import { LocadoresService } from "src/service/locadores.service";

@Module({
    imports: [TypeOrmModule.forFeature([Local, Agendamento])],
    controllers: [LocadoresController],
    providers: [LocadoresService],
})
export class LocadoresModule { }
