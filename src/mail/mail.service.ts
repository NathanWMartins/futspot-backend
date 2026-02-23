import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendCodigoVerificacao(email: string, codigo: string) {
    await this.mailerService.sendMail({
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
}
