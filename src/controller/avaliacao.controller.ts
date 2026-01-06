import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CreateAvaliacaoDto } from "src/classes/dto/agendamento/create-avaliacao.dto";
import { AvaliacaoService } from "src/service/avaliacao.service";

@Controller("avaliacoes")
@UseGuards(AuthGuard("jwt"))
export class AvaliacaoController {
    constructor(private readonly avaliacaoService: AvaliacaoService) { }

    @Post()
    criar(@Req() req: any, @Body() dto: CreateAvaliacaoDto) {
        const jogadorId = req.user?.sub;
        return this.avaliacaoService.criar(jogadorId, dto);
    }
}
