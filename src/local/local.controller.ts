import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AgendamentosService } from "src/agendamentos/agendamentos.service";
import { CreateLocalDto } from "src/local/dto/create-local.dto";
import { UpdateLocalDto } from "src/local/dto/update-local.dto";
import { LocalService } from "src/local/local.service";
import { Roles } from "src/roles/roles.decorator";

@Controller("locais")
@UseGuards(AuthGuard("jwt"))
export class LocalController {
    constructor(private readonly localService: LocalService,
        private readonly agendamentosService: AgendamentosService) { }

    @Get()
    listar(@Req() req: any) {
        const donoId = req.user.sub;
        return this.localService.listarPorDono(donoId);
    }

    @Post()
    @Roles("locador")
    criar(@Req() req: any, @Body() dto: CreateLocalDto) {
        const donoId = req.user?.sub;
        return this.localService.criar(donoId, dto);
    }

    @Put(":id")
    @Roles("locador")
    atualizar(
        @Req() req: any,
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateLocalDto,
    ) {
        const donoId = req.user?.sub;
        return this.localService.atualizar(donoId, id, dto);
    }

    @Get(":id/disponibilidade")
    disponibilidade(
        @Param("id", ParseIntPipe) id: number,
        @Query("data") data: string,
    ) {
        return this.agendamentosService.disponibilidade(id, data);
    }

    @Delete(":id")
    remover(
        @Req() req: any,
        @Param("id", ParseIntPipe) id: number,
    ) {
        return this.localService.remover(req.user.sub, id);
    }

    //Jogador
    @Get("search")
    @Roles("jogador")
    buscarLocais(
        @Query("cidade") cidade: string,
        @Query("data") data: string,
        @Query("tipos") tipos: string,
        @Query("periodos") periodos?: string
    ) {
        return this.localService.buscarLocais({ cidade, data, tipos, periodos });
    }

    @Get(":id/disponibilidade/data")
    @Roles("jogador")
    async disponibilidadePorData(
        @Param("id") id: string,
        @Query("data") data: string
    ) {

        if (!data) throw new BadRequestException("Parâmetro 'data' é obrigatório (YYYY-MM-DD).");
        return this.localService.getDisponibilidadePorData(Number(id), data);
    }

    @Roles('jogador')
    @Get(':id')
    async buscarPorId(@Param('id') id: number) {
        return this.localService.buscarPorId(id);
    }
}
