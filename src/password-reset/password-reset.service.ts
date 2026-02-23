import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { PasswordReset } from "./password-reset.entity";
import { Repository } from "typeorm";
import { User } from "src/user/user.entity";
import { addMinutes } from "date-fns";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { MailService } from "src/mail/mail.service";


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
        const user = await this.userRepo.findOne({ where: { email } });

        if (!user) {
            return { message: 'Se o e-mail existir, enviaremos instruções.' };
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(rawToken, 10);

        await this.passwordResetRepo.save({
            email,
            tokenHash,
            expiresAt: addMinutes(new Date(), 15),
        });

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;

        await this.mailService.sendResetPassword(email, resetLink);

        return { message: 'Se o e-mail existir, enviaremos instruções.' };
    }

    async resetPassword(token: string, newPassword: string) {
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