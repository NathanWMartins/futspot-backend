import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  Index,
} from "typeorm";
import { Local } from "../local/local.entity";
import { User } from "../user/user.entity";
import { Agendamento } from "../agendamentos/agendamento.entity";

@Entity("avaliacoes_locais")
@Unique("UQ_avaliacao_agendamento", ["agendamentoId"]) 
export class AvaliacaoLocal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  @Index()
  localId: number;

  @ManyToOne(() => Local, { onDelete: "CASCADE" })
  @JoinColumn({ name: "localId" })
  local: Local;

  @Column({ type: "int" })
  @Index()
  jogadorId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "jogadorId" })
  jogador: User;

  @Column({ type: "int" })
  @Index()
  agendamentoId: number;

  @ManyToOne(() => Agendamento, { onDelete: "CASCADE" })
  @JoinColumn({ name: "agendamentoId" })
  agendamento: Agendamento;

  @Column({ type: "numeric", precision: 2, scale: 1 })
  nota: number;

  @Column({ type: "text", nullable: true })
  comentario?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
