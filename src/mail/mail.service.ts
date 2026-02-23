import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendCodigoVerificacao(email: string, codigo: string) {
    await this.resend.emails.send({
      from: 'FutSpot <onboarding@resend.dev>',
      to: email,
      subject: 'Seu código de verificação - FutSpot',
      html: `
        <div style="font-family: Arial; text-align: center;">
          <h2>Bem-vindo ao FutSpot ⚽</h2>
          <p>Seu código de verificação é:</p>
          <h1 style="letter-spacing: 6px;">${codigo}</h1>
          <p>Esse código expira em 10 minutos.</p>
        </div>
      `,
    });
  }

  async sendResetPassword(email: string, resetLink: string) {
    await this.resend.emails.send({
      from: 'FutSpot <onboarding@resend.dev>',
      to: email,
      subject: 'Instruções para redefinir sua senha - FutSpot',
      html: `
        <div style="font-family: Arial; text-align: center;">
          <h2>Redefinição de Senha - FutSpot ⚽</h2>
          <p>Clique no link abaixo para redefinir sua senha:</p>
          <a href="${resetLink}"
             style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">
             Redefinir Senha
          </a>
          <p>Esse link expira em 15 minutos.</p>
        </div>
      `,
    });
  }
}