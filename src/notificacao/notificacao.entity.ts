import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { StatusNotificacao, TipoNotificacao } from './enum/notificacao.enum';

@Entity('notificacoes')
export class Notificacao {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  usuarioId: number;

  @Column({ nullable: true })
  agendamentoId?: number;

  @Column({
    type: 'enum',
    enum: TipoNotificacao,
  })
  tipo: TipoNotificacao;

  @Column({
    type: 'enum',
    enum: StatusNotificacao,
    default: StatusNotificacao.NAO_LIDA,
  })
  status: StatusNotificacao;

  @Column()
  titulo: string;

  @Column()
  mensagem: string;

  @CreateDateColumn()
  criadoEm: Date;
}
