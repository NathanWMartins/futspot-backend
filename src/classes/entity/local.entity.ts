import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";
import { HorarioFuncionamento } from "./horario-funcionamento.entity";

export type TipoLocal = 'society' | 'futsal' | 'campo';

@Entity("locais")
export class Local {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nome: string;

    @Column({ nullable: true })
    descricao?: string;

    @Column({ nullable: true })
    cep: string;

    @Column({ nullable: false })
    endereco: string;

    @Column({ nullable: true })
    cidade: string;

    @Column({ nullable: true })
    numero: string;

    @Column({ nullable: false })
    tipoLocal: TipoLocal;

    @Column({ nullable: false })
    precoHora: number;

    @Column("text", { array: true, default: [] })
    fotos: string[];

    @OneToMany(() => HorarioFuncionamento, (h) => h.local, { cascade: true })
    horarios: HorarioFuncionamento[];

    @ManyToOne(() => User, (user) => user.locais, {
        onDelete: "CASCADE",
    })
    dono: User;

    @Column()
    donoId: number;

    @CreateDateColumn()
    createdAt: Date;
}
