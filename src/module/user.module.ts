import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Agendamento } from "src/classes/entity/agendamento.entity";
import { User } from "src/classes/entity/user.entity";
import { UserController } from "src/controller/user.controller";
import { UserService } from "src/service/user.service";

@Module({
    imports: [TypeOrmModule.forFeature([User, Agendamento])],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }
