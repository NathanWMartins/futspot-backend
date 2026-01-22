import { MinLength } from "class-validator";
import { Column } from "typeorm";

export class CreateUserDto {
    @Column({ nullable: true })
    nome?: string;

    @Column({ type: "varchar", nullable: true })
    telefone?: string | null;

    @Column({ nullable: true })
    email?: string;

    @Column({ nullable: true })
    @MinLength(6)
    senha?: string;

    @Column({ nullable: true })
    fotoUrl?: string;
}