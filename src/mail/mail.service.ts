import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend = new Resend(process.env.RESEND_API_KEY);

  async sendCodigoVerificacao(email: string, codigo: string) {
    const response = await this.resend.emails.send({
      from: 'FutSpot <contato@futspot.xyz>',
      to: email,
      subject: 'Seu código de verificação - FutSpot',
      html: `
      <div style="font-family: Arial, sans-serif; text-align: center; background-color: #f6f6f6; padding: 40px 20px;">
        <div style="max-width: 450px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 30px;">
          
          <!-- Header -->
          <h2 style="color: #00E676; margin-bottom: 5px;">Bem-vindo ao FutSpot ⚽</h2>
          <p style="color: #333333; font-size: 16px; margin-top: 0;">Seu código de verificação está pronto!</p>
          
          <!-- Código em destaque -->
          <div style="margin: 30px 0;">
            <span style="
              font-size: 28px;
              letter-spacing: 8px;
              color: #ffffff;
              background: linear-gradient(90deg, #00E676, #00B34C);
              padding: 15px 35px;
              border-radius: 8px;
              display: inline-block;
              font-weight: bold;
            ">
              ${codigo}
            </span>
          </div>

          <p style="color: #555555; font-size: 14px; margin-top: 10px;">Esse código expira em 10 minutos.</p>

          <div style="margin-top: 40px; font-size: 12px; color: #888888; line-height: 1.5;">
            <p>FutSpot © 2026</p>
            <p>Contato: <a href="mailto:futspot.app@gmail.com" style="color: #00E676; text-decoration: none;">futspot.app@gmail.com</a></p>
            <p>Instagram: 
              <a href="https://instagram.com/futspot.oficial" 
                style="color: #00E676; text-decoration: none;" 
                target="_blank">
                @seu_usuario
              </a>
            </p>
            <p>Não compartilhe este código com ninguém.</p>
          </div>

        </div>
      </div>
    `,
    });
    if (!response?.data?.id) {
      throw new Error('Falha ao enviar e-mail');
    }
  }

  async sendResetPassword(email: string, resetLink: string) {
    await this.resend.emails.send({
      from: 'FutSpot <contato@futspot.xyz>',
      to: email,
      subject: 'Instruções para redefinir sua senha - FutSpot',
      html: `
      <div style="font-family: Arial, sans-serif; text-align: center; background-color: #f6f6f6; padding: 40px 20px;">
        <div style="max-width: 450px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 30px;">
          
          <!-- Header -->
          <h2 style="color: #00E676; margin-bottom: 10px;">Redefinição de Senha ⚽</h2>
          <p style="color: #333333; font-size: 16px; margin-top: 0;">
            Clique no botão abaixo para redefinir sua senha:
          </p>
          
          <!-- Botão -->
          <div style="margin: 30px 0;">
            <a href="${resetLink}"
               style="
                 display: inline-block;
                 padding: 15px 35px;
                 font-size: 16px;
                 font-weight: bold;
                 color: #ffffff;
                 text-decoration: none;
                 border-radius: 8px;
                 background: linear-gradient(90deg, #00E676, #00B34C);
               "
               target="_blank">
               Redefinir Senha
            </a>
          </div>
          
          <p style="color: #555555; font-size: 14px; margin-top: 10px;">
            Esse link expira em 15 minutos.
          </p>

          <div style="margin-top: 40px; font-size: 12px; color: #888888; line-height: 1.5;">
            <p>FutSpot © 2026</p>
            <p>Contato: <a href="mailto:suporte@futspot.com" style="color: #00E676; text-decoration: none;">suporte@futspot.com</a></p>
            <p>Instagram: <a href="https://instagram.com/futspot.oficial" style="color: #00E676; text-decoration: none;" target="_blank">@seu_usuario</a></p>
            <p>Se você não solicitou esta redefinição, ignore este e-mail.</p>
          </div>

        </div>
      </div>
    `,
    });
  }
}
