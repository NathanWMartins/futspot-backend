import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgendamentosService } from './agendamentos.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';

@Controller('agendamentos')
@UseGuards(AuthGuard('jwt'))
export class AgendamentosController {
  constructor(private readonly service: AgendamentosService) {}

  @Post()
  criar(@Req() req: any, @Body() dto: CreateAgendamentoDto) {
    const jogadorId = req.user.sub;
    return this.service.criarAgendamento(jogadorId, dto);
  }

  @Delete(':id')
  cancelar(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    return this.service.cancelarAgendamento(userId, id);
  }

  @Patch(':id/confirmar')
  confirmar(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    return this.service.confirmarAgendamento(userId, id);
  }

  @Patch(':id/recusar')
  recusar(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.sub;
    return this.service.recusarAgendamento(userId, id);
  }

  @Get('me')
  minhaAgenda(@Req() req: any) {
    const jogadorId = req.user.sub;
    return this.service.getMinhaAgenda(jogadorId);
  }
}
