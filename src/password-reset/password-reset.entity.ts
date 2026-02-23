import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class PasswordReset {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column()
  tokenHash!: string;

  @Column()
  expiresAt!: Date;
}