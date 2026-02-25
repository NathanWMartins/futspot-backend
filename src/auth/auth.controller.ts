import { Body, Controller, Get, Post } from '@nestjs/common';
import { RegisterDto } from '../user/dto/register.dto';
import { LoginDto } from '../user/dto/login.dto';
import { AuthService } from './auth.service';
import { PasswordResetService } from 'src/password-reset/password-reset.service';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() body: { email: string; codigo: string }) {
    return this.authService.verifyEmailCode(body.email, body.codigo);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @Throttle({ default: { limit: 3, ttl: 900_000 } })
  @Post('redefinir-senha')
  async redefinirSenha(@Body() body: { email: string }) {
    return this.passwordResetService.requestPasswordReset(body.email);
  }

  @Post('redefinir-senha/confirm')
  async confirmReset(@Body() body: { token: string; password: string, confirmPassword: string }) {
    return this.passwordResetService.resetPassword(body.token, body.password, body.confirmPassword);
  }
}
