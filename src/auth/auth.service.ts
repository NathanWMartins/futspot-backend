import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../user/dto/login.dto';
import { RegisterDto } from '../user/dto/register.dto';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { EmailVerification } from 'src/mail/email-verification.entity';
import { MailService } from 'src/mail/mail.service';
import { addMinutes } from 'date-fns';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,

    @InjectRepository(EmailVerification)
    private readonly emailVerificationRepo: Repository<EmailVerification>,

    private readonly mailService: MailService,

    private dataSource: DataSource,
  ) {}

  private signToken(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      tipoUsuario: user.tipoUsuario,
    };

    return this.jwtService.sign(payload);
  }

  async register(dto: RegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(User, {
        where: { email: dto.email },
      });

      if (existing) {
        throw new BadRequestException('Este e-mail já está cadastrado.');
      }

      const senhaHash = await bcrypt.hash(dto.senha, 10);

      const user = queryRunner.manager.create(User, {
        nome: dto.nome,
        email: dto.email,
        senhaHash,
        tipoUsuario: dto.tipoUsuario,
        fotoUrl: dto.fotoUrl,
        emailVerificado: false,
      });

      await queryRunner.manager.save(user);

      const codigo = Math.floor(100000 + Math.random() * 900000).toString();

      await queryRunner.manager.save(EmailVerification, {
        email: user.email,
        codigo,
        expiresAt: addMinutes(new Date(), 10),
      });
      await this.mailService.sendCodigoVerificacao(user.email, codigo);

      await queryRunner.commitTransaction();

      return {
        message: 'Código de verificação enviado para o e-mail.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Erro ao enviar e-mail. Tente novamente.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async verifyEmailCode(email: string, codigo: string) {
    const user = await this.userRepo.findOne({
      where: { email },
    });

    const verification = await this.emailVerificationRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    if (user.emailVerificado) {
      throw new BadRequestException('E-mail já verificado.');
    }

    if (verification?.codigo !== codigo) {
      throw new BadRequestException('Código inválido.');
    }

    if (verification.expiresAt && verification.expiresAt < new Date()) {
      throw new BadRequestException('Código expirado.');
    }

    user.emailVerificado = true;
    user.emailCodigo = undefined;
    user.emailCodigoExpira = undefined;

    await this.userRepo.save(user);

    const access_token = this.signToken(user);

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipoUsuario: user.tipoUsuario,
        fotoUrl: user.fotoUrl,
      },
      access_token,
    };
  }
  

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      select: ['id', 'nome', 'email', 'tipoUsuario', 'fotoUrl', 'senhaHash'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (user.tipoUsuario !== dto.tipoUsuario) {
      throw new BadRequestException(
        `Este e-mail está cadastrado como ${user.tipoUsuario}, não como ${dto.tipoUsuario}.`,
      );
    }

    const senhaOk = await bcrypt.compare(dto.senha, user.senhaHash);
    if (!senhaOk) {
      throw new BadRequestException('Senha inválida.');
    }

    const access_token = this.signToken(user);

    return {
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipoUsuario: user.tipoUsuario,
        fotoUrl: user.fotoUrl,
      },
      access_token,
    };
  }
}
