import { Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { NotificacaoService } from './notificacao.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('notificacoes')
@UseGuards(AuthGuard('jwt'))
export class NotificacaoController {
  constructor(private readonly notificacaoService: NotificacaoService) {}

  @Get('nao-lidas-numero')
  getNotificacoesNaoLidasCount(@Req() req) {
    return this.notificacaoService.getNotificacoesNaoLidasCount(req.user.sub);
  }

  @Get('nao-lidas')
  getNotificacoesNaoLidasDetalhadas(@Req() req) {
    const userId = req.user.sub;
    return this.notificacaoService.getNotificacoesNaoLidas(userId);
  }

  @Get('lidas')
  getNotificacoesLidasDetalhadas(@Req() req) {
    const userId = req.user.sub;
    return this.notificacaoService.getNotificacoesLidas(userId);
  }

  @Patch(':id/marcar-como-lida')
  marcarComoLida(@Param('id') id: string) {
    return this.notificacaoService.marcarComoLida(id);
  }
}
