import { Module } from '@nestjs/common';
import { AuthController } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from './mail.module';
import { EmailVerification } from 'src/mail/email-verification.entity';
import { PasswordReset } from 'src/password-reset/password-reset.entity';
import { PasswordResetService } from 'src/password-reset/password-reset.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, EmailVerification, PasswordReset]),
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.registerAsync({
            imports: [ConfigModule, MailModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>("JWT_SECRET"),
                signOptions: { expiresIn: "7d" },
            }),
        }),
        MailModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, PasswordResetService],
    exports: [JwtModule, PassportModule, PasswordResetService],
})
export class AuthModule { }