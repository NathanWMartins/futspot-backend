import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Local } from './local.entity';

export type TipoUsuario = 'jogador' | 'locador';

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nome: string;

    @Column({ unique: true })
    email: string;

    @Column({ type: "varchar", nullable: true })
    telefone?: string | null;

    @Column()
    senhaHash: string;

    @Column({ type: "varchar" })
    tipoUsuario: TipoUsuario;

    @OneToMany(() => Local, (local) => local.dono, { cascade: true })
    locais?: Local[];

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    fotoUrl?: string;
}
