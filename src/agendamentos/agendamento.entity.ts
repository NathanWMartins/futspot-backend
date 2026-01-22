import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Local } from "../local/local.entity";
import { User } from "../user/user.entity";

export enum StatusAgendamento {
    CONFIRMADO = "confirmado",
    CANCELADO = "cancelado",
    SOLICITADO = "solicitado",
    RECUSADO = "recusado",
}

export enum CanceladoPor {
    JOGADOR,
    DONO_QUADRA,
    SISTEMA
}

@Entity("agendamentos")
@Index(["localId", "data", "inicio"], { unique: true }) 
export class Agendamento {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Local, { onDelete: "CASCADE" })
    local: Local;

    @Column()
    localId: number;

    @ManyToOne(() => User, { onDelete: "CASCADE" })
    jogador: User;

    @Column()
    jogadorId: number;

    @Column({ type: "date" })
    data: string;

    @Column({ type: "time" })
    inicio: string;

    @Column({ type: "enum", enum: StatusAgendamento, default: StatusAgendamento.CONFIRMADO })
    status: StatusAgendamento;

    @Column({nullable: true})
    canceladoPor?: CanceladoPor;

    @CreateDateColumn()
    createdAt: Date;

    @Column()
    valorPagar: number;
}
