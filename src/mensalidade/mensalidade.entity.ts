import { Local } from 'src/local/local.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('mensalidades')
export class Mensalidade {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  nomeResponsavel: string;

  @Column({ length: 14 })
  cpf: string;

  @Column({ length: 20 })
  celular: string;

  @Column()
  diaSemana: number;

  @Column({ type: 'time' })
  horaInicio: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  valor: number;

  @ManyToOne(() => Local, (local) => local.mensalidades, {
    onDelete: 'CASCADE',
  })
  local: Local;

  @Column()
  localId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
