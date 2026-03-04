import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocadoresService } from 'src/locadores/locadores.service';
import { Roles } from 'src/roles/roles.decorator';

@Controller('locadores')
@UseGuards(AuthGuard('jwt'))
export class LocadoresController {
  constructor(private readonly locadoresService: LocadoresService) {}

  @Get('me/ocupacao')
  @Roles('locador')
  ocupacaoDoDia(@Req() req: any, @Query('data') data: string) {
    const donoId = req.user.sub;
    return this.locadoresService.ocupacaoDoDia(donoId, data);
  }

  @Get('jogador/:jogadorId/stats')
  @Roles('locador')
  getPerfilJogador(@Req() req: any, @Param('jogadorId') jogadorId: string) {
    const locadorId = req.user.sub;
    return this.locadoresService.getPerfilJogador(locadorId, Number(jogadorId));
  }
}
