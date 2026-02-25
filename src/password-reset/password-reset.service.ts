import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordReset } from './password-reset.entity';
import { MoreThan, Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { addMinutes } from 'date-fns';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepo: Repository<PasswordReset>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly mailService: MailService,
  ) { }

  async requestPasswordReset(email: string) {
    if (!email) {
      throw new BadRequestException('Informe um e-mail válido.');
    }

    const safeResponse = {
      message: 'Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.',
    };

    try {
      const user = await this.userRepo.findOne({ where: { email } });

      if (!user) {
        return 'E-mail não está cadastrado na plataforma.';
      }

      const existing = await this.passwordResetRepo.findOne({
        where: {
          email,
          expiresAt: MoreThan(new Date()),
        },
      });

      if (existing) {
        return 'Já existe um pedido de redefinição de senha ativo para este e-mail. Verifique sua caixa de entrada.';
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(rawToken, 10);

      await this.passwordResetRepo.delete({ email });

      await this.passwordResetRepo.save({
        email,
        tokenHash,
        expiresAt: addMinutes(new Date(), 15),
      });

      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

      await this.mailService.sendResetPassword(email, resetLink);

      return safeResponse;

    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);

      throw new InternalServerErrorException(
        'Não foi possível processar sua solicitação. Tente novamente mais tarde.'
      );
    }
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    if (newPassword.length < 6) {
      throw new BadRequestException("A senha deve ter pelo menos 6 caracteres.");
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException("As senhas não coincidem.");
    }

    const resets = await this.passwordResetRepo.find();

    let validReset: PasswordReset | null = null;

    for (const reset of resets) {
      const isMatch = await bcrypt.compare(token, reset.tokenHash);
      if (isMatch && reset.expiresAt > new Date()) {
        validReset = reset;
        break;
      }
    }

    if (!validReset) {
      throw new BadRequestException('Token inválido ou expirado.');
    }

    const user = await this.userRepo.findOne({
      where: { email: validReset.email },
    });

    if (!user) {
      throw new BadRequestException('Usuário não encontrado.');
    }

    const senhaHash = await bcrypt.hash(newPassword, 10);
    user.senhaHash = senhaHash;

    await this.userRepo.save(user);

    await this.passwordResetRepo.delete({ id: validReset.id });

    return { message: 'Senha redefinida com sucesso.' };
  }
}
