import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AgendamentosService } from "../agendamentos/agendamentos.service";
import { CreateAgendamentoDto } from "../classes/dto/agendamento/create-agendamento.dto";

@Controller("agendamentos")
@UseGuards(AuthGuard("jwt"))
export class AgendamentosController {
    constructor(private readonly service: AgendamentosService) { }

    @Post()
    criar(@Req() req: any, @Body() dto: CreateAgendamentoDto) {
        const jogadorId = req.user.sub;
        return this.service.criarAgendamento(jogadorId, dto);
    }

    @Delete(":id")
    cancelar(@Req() req: any, @Param("id", ParseIntPipe) id: number) {
        const userId = req.user.sub;
        return this.service.cancelarAgendamento(userId, id);
    }

    @Get("me")
    minhaAgenda(@Req() req: any) {
        const jogadorId = req.user.sub;
        return this.service.getMinhaAgenda(jogadorId);
    }

}
