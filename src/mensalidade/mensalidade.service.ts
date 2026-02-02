import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mensalidade } from './mensalidade.entity';
import { CreateMensalidadeDto } from './dto/create-mensalidade.dto';
import { UpdateMensalidadeDto } from './dto/update-mensalidade.dto';

@Injectable()
export class MensalidadesService {
  constructor(
    @InjectRepository(Mensalidade)
    private readonly repo: Repository<Mensalidade>,
  ) {}

  async create(dto: CreateMensalidadeDto) {
    const cpfJaExiste = await this.repo.findOne({
      where: { cpf: dto.cpf },
    });

    if (cpfJaExiste) {
      throw new BadRequestException(
        'Já existe uma mensalidade cadastrada com este CPF',
      );
    }
    const mensalidade = this.repo.create(dto);
    return this.repo.save(mensalidade);
  }

  findByLocal(localId: number) {
    return this.repo.find({
      where: { localId },
      order: {
        diaSemana: 'ASC',
        horaInicio: 'ASC',
      },
    });
  }

  async update(id: number, dto: UpdateMensalidadeDto) {
    const mensalidade = await this.repo.findOne({ where: { id } });

    if (!mensalidade) {
      throw new NotFoundException('Mensalidade não encontrada');
    }

    Object.assign(mensalidade, dto);
    return this.repo.save(mensalidade);
  }

  async remove(id: number) {
    const mensalidade = await this.repo.findOne({ where: { id } });

    if (!mensalidade) {
      throw new NotFoundException('Mensalidade não encontrada');
    }

    return this.repo.remove(mensalidade);
  }
}
