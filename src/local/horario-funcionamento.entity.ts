import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Local } from "./local.entity";

export enum DiaSemana {
    DOM = 0,
    SEG = 1,
    TER = 2,
    QUA = 3,
    QUI = 4,
    SEX = 5,
    SAB = 6,
}

@Entity("horarios_funcionamento")
@Unique(["localId", "diaSemana"]) 
export class HorarioFuncionamento {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    diaSemana!: DiaSemana;

    @Column({ type: "boolean", default: true })
    aberto!: boolean;

    @Column({ type: "time", nullable: true })
    inicio!: string | null; 

    @Column({ type: "time", nullable: true })
    fim!: string | null;

    @ManyToOne(() => Local, (local) => local.horarios, { onDelete: "CASCADE" })
    local!: Local;

    @Column()
    localId!: number;
}
