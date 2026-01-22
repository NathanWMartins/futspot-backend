import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocadoresService } from 'src/locadores/locadores.service';

@Controller('locadores')
@UseGuards(AuthGuard('jwt'))
export class LocadoresController {
  constructor(private readonly locadoresService: LocadoresService) {}

  @Get('me/ocupacao')
  ocupacaoDoDia(@Req() req: any, @Query('data') data: string) {
    const donoId = req.user.sub;
    return this.locadoresService.ocupacaoDoDia(donoId, data);
  }

  @Get('jogador/:jogadorId/stats')
  getPerfilJogador(@Req() req: any, @Param('jogadorId') jogadorId: string) {
    const locadorId = req.user.sub;
    return this.locadoresService.getPerfilJogador(locadorId, Number(jogadorId));
  }
}
