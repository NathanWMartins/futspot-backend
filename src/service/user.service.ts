import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserDto } from 'src/classes/dto/user/update-user.dto';
import { User } from 'src/classes/entity/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Agendamento,
  StatusAgendamento,
} from 'src/classes/entity/agendamento.entity';
import {
  JogadorStatsResponse,
  LocadorStatsResponse,
} from 'src/classes/dto/user/user-stats.dto';
import { Local } from 'src/classes/entity/local.entity';

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
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const raw = await this.agendamentoRepository
      .createQueryBuilder('ag')
      .select('COUNT(ag.id)', 'totalReservas')
      .addSelect('COUNT(DISTINCT ag.localId)', 'locaisDiferentes')
      .where('ag.jogadorId = :userId', { userId })
      .andWhere('ag.status = :st', { st: StatusAgendamento.CONFIRMADO })
      .getRawOne();

    return {
      createdAt: user.createdAt.toISOString(),
      totalReservas: Number(raw?.totalReservas ?? 0),
      locaisDiferentes: Number(raw?.locaisDiferentes ?? 0),
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

    const raw = await this.agendamentoRepository
      .createQueryBuilder('ag')
      .innerJoin('ag.local', 'l')
      .select('COUNT(ag.id)', 'totalReservas')
      .addSelect('COALESCE(SUM(ag.valorPagar), 0)', 'totalFaturamento')
      .where('l.donoId = :userId', { userId })
      .andWhere('ag.status = :st', { st: StatusAgendamento.CONFIRMADO })
      .getRawOne();

    return {
      createdAt: user.createdAt.toISOString(),
      totalQuadras,
      totalReservas: Number(raw?.totalReservas ?? 0),
      totalFaturamento: Number(raw?.totalFaturamento ?? 0),
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
