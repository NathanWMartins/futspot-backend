import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    Put,
    Req,
    UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CreateLocalDto } from "src/classes/dto/local/create-local.dto";
import { UpdateLocalDto } from "src/classes/dto/local/update-local.dto";
import { LocalService } from "src/service/local.service";

@Controller("locais")
@UseGuards(AuthGuard("jwt"))
export class LocalController {
    constructor(private readonly localService: LocalService) { }

    @Get()
    listar(@Req() req: any) {
        const donoId = req.user.sub;
        return this.localService.listarPorDono(donoId);
    }

    @Post()
    criar(@Req() req: any, @Body() dto: CreateLocalDto) {
        const donoId = req.user?.sub;
        return this.localService.criar(donoId, dto);
    }

    @Put(":id")
    atualizar(
        @Req() req: any,
        @Param("id", ParseIntPipe) id: number,
        @Body() dto: UpdateLocalDto,
    ) {
        const donoId = req.user?.sub;
        return this.localService.atualizar(donoId, id, dto);
    }

    @Delete(":id")
    remover(
        @Req() req: any,
        @Param("id", ParseIntPipe) id: number,
    ) {
        return this.localService.remover(req.user.id, id);
    }
}
