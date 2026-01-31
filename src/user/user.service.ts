import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from 'src/user/dto/update-user.dto';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Agendamento,
  CanceladoPor,
  StatusAgendamento,
} from 'src/agendamentos/agendamento.entity';
import {
  JogadorStatsResponse,
  LocadorStatsResponse,
} from 'src/user/dto/user-stats.dto';
import { Local } from 'src/local/local.entity';
import { AvaliacaoLocal } from 'src/avaliacao/avaliacao-local.entity';

@Injectable()
export class UserService {
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Agendamento)
    private readonly agendamentoRepository: Repository<Agendamento>,

    @InjectRepository(Local)
    private readonly localRepository: Repository<Local>,

    @InjectRepository(AvaliacaoLocal)
    private readonly avaliacaoRepository: Repository<AvaliacaoLocal>,
  ) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = process.env.SUPABASE_BUCKET_AVATARS || 'avatars';

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no backend.',
      );
    }

    this.supabase = createClient(url, key);
  }

  async uploadFotoPerfil(userId: number, file: Express.Multer.File) {
    if (!file) {
      throw new Error('Arquivo não enviado.');
    }

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowed.has(file.mimetype)) {
      throw new BadRequestException(
        'Formato inválido. Envie JPG, PNG ou WEBP.',
      );
    }

    const ext = mimeToExt(file.mimetype);
    const path = `perfil/${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new InternalServerErrorException(
        `Erro ao enviar foto: ${uploadError.message}`,
      );
    }

    // URL pública (bucket precisa estar PUBLIC)
    const { data: publicData } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
    const publicUrl = publicData?.publicUrl;

    if (!publicUrl) {
      throw new InternalServerErrorException(
        'Não foi possível obter a URL pública da foto.',
      );
    }

    // Salva no usuário
    await this.userRepository.update(userId, { fotoUrl: publicUrl });

    return { url: publicUrl };
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    user.nome = dto.nome ?? user.nome;
    user.email = dto.email ?? user.email;
    user.telefone = dto.telefone ?? user.telefone;
    user.fotoUrl = dto.fotoUrl ?? user.fotoUrl;

    if (typeof dto.senha === 'string' && dto.senha.trim().length > 0) {
      user.senhaHash = await bcrypt.hash(dto.senha, 10);
    }

    return this.userRepository.save(user);
  }

  async getMeStatsJogador(userId: number): Promise<JogadorStatsResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const ags = await this.agendamentoRepository
      .createQueryBuilder('ag')
      .where('ag.jogadorId = :userId', { userId })
      .andWhere('ag.status IN (:...status)', {
        status: [StatusAgendamento.CONFIRMADO, StatusAgendamento.CANCELADO],
      })
      .getMany();

    const totalAgendamentos = ags.length;

    const totalCancelados = ags.filter(
      (a) =>
        a.status === StatusAgendamento.CANCELADO &&
        a.canceladoPor === CanceladoPor.JOGADOR,
    ).length;

    const taxaCancelamento =
      totalAgendamentos === 0
        ? 0
        : Math.round((totalCancelados / totalAgendamentos) * 100);

    let comportamento: JogadorStatsResponse['comportamento'];

    if (taxaCancelamento === 0) {
      comportamento = 'Nunca cancelou';
    } else if (taxaCancelamento <= 10) {
      comportamento = 'Raramente cancela';
    } else if (taxaCancelamento <= 30) {
      comportamento = 'Às vezes cancela';
    } else {
      comportamento = 'Cancela com frequência';
    }

    const rawReservas = await this.agendamentoRepository
      .createQueryBuilder('ag')
      .select('COUNT(ag.id)', 'totalReservas')
      .addSelect('COUNT(DISTINCT ag.localId)', 'locaisDiferentes')
      .where('ag.jogadorId = :userId', { userId })
      .andWhere('ag.status = :st', { st: StatusAgendamento.CONFIRMADO })
      .getRawOne();

    const avaliacoes = await this.avaliacaoRepository
      .createQueryBuilder('av')
      .where('av.jogadorId = :userId', { userId })
      .select('av.nota', 'nota')
      .getRawMany();

    const totalAvaliacoes = avaliacoes.length;

    const mediaAvaliacoes =
      totalAvaliacoes === 0
        ? null
        : Number(
            (
              avaliacoes.reduce((sum, a) => sum + Number(a.nota), 0) /
              totalAvaliacoes
            ).toFixed(1),
          );
    return {
      createdAt: user.createdAt.toISOString(),
      totalReservas: Number(rawReservas?.totalReservas ?? 0),
      locaisDiferentes: Number(rawReservas?.locaisDiferentes ?? 0),
      comportamento,
      mediaAvaliacoes,
      totalAvaliacoes,
      taxaCancelamento,
    };
  }

  async getMeStatsLocador(userId: number): Promise<LocadorStatsResponse> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'createdAt'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const totalQuadras = await this.localRepository.count({
      where: { donoId: userId },
    });

    const reservasRaw = await this.agendamentoRepository
      .createQueryBuilder('ag')
      .innerJoin('ag.local', 'l')
      .select('COUNT(ag.id)', 'totalReservas')
      .addSelect('COALESCE(SUM(ag.valorPagar), 0)', 'totalFaturamento')
      .where('l.donoId = :userId', { userId })
      .andWhere('ag.status = :st', { st: StatusAgendamento.CONFIRMADO })
      .getRawOne();

    const totalReservas = Number(reservasRaw?.totalReservas ?? 0);
    const totalFaturamento = Number(reservasRaw?.totalFaturamento ?? 0);

    const ags = await this.agendamentoRepository
      .createQueryBuilder('ag')
      .innerJoin('ag.local', 'l')
      .where('l.donoId = :userId', { userId })
      .andWhere('ag.status = :st', { st: StatusAgendamento.CANCELADO })
      .andWhere('ag.canceladoPor = :cp', {
        cp: CanceladoPor.DONO_QUADRA,
      })
      .getMany();

    const totalAgendamentos = await this.agendamentoRepository
      .createQueryBuilder('ag')
      .innerJoin('ag.local', 'l')
      .where('l.donoId = :userId', { userId })
      .getCount();

    const totalCancelados = ags.length;

    const taxaCancelamento =
      totalAgendamentos === 0
        ? 0
        : Math.round((totalCancelados / totalAgendamentos) * 100);

    let comportamento: LocadorStatsResponse['comportamento'];

    if (taxaCancelamento === 0) {
      comportamento = 'Nunca cancelou';
    } else if (taxaCancelamento <= 10) {
      comportamento = 'Raramente cancela';
    } else if (taxaCancelamento <= 30) {
      comportamento = 'Às vezes cancela';
    } else {
      comportamento = 'Cancela com frequência';
    }

    const avaliacoes = await this.avaliacaoRepository
      .createQueryBuilder('av')
      .innerJoin('av.local', 'l')
      .where('l.donoId = :userId', { userId })
      .select('av.nota', 'nota')
      .getRawMany();

    const totalAvaliacoes = avaliacoes.length;

    const mediaAvaliacoes =
      totalAvaliacoes === 0
        ? null
        : Number(
            (
              avaliacoes.reduce((sum, a) => sum + Number(a.nota), 0) /
              totalAvaliacoes
            ).toFixed(1),
          );

    return {
      createdAt: user.createdAt.toISOString(),
      totalQuadras,
      locaisCadastrados: totalQuadras,
      totalReservas,
      totalFaturamento,
      comportamento,
      mediaAvaliacoes,
      totalAvaliacoes,
      taxaCancelamento
    };
  }
}

function mimeToExt(mime: string) {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return 'jpg';
  }
}
