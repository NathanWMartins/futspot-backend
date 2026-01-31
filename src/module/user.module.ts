import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Agendamento } from "src/agendamentos/agendamento.entity";
import { AvaliacaoLocal } from "src/avaliacao/avaliacao-local.entity";
import { Local } from "src/local/local.entity";
import { UserController } from "src/user/user.controller";
import { User } from "src/user/user.entity";
import { UserService } from "src/user/user.service";

@Module({
    imports: [TypeOrmModule.forFeature([User, Agendamento, Local, AvaliacaoLocal])],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }
