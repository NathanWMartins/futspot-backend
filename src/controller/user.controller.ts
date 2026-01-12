import { Body, Controller, Get, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { FileInterceptor } from "@nestjs/platform-express";
import { UpdateUserDto } from "src/classes/dto/user/update-user.dto";
import { UserService } from "src/service/user.service";

@Controller("user")
@UseGuards(AuthGuard("jwt"))
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post("uploads/foto-perfil")
    @UseInterceptors(FileInterceptor("file"))
    async uploadFotoPerfil(
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
    ) {
        const userId = req.user.sub;
        return this.userService.uploadFotoPerfil(userId, file);
    }

    @Put("update/me")
    async updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
        const userId = req.user.sub;
        const user = await this.userService.updateMe(userId, dto);
        return {
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                telefone: user.telefone,
                tipoUsuario: user.tipoUsuario,
                fotoUrl: user.fotoUrl,
            },
        };
    }

    @Get("jogador/me/stats")
    getMeStatsJogador(@Req() req: any) {
        const userId = req.user.sub;
        return this.userService.getMeStatsJogador(userId);
    }

    @Get("locador/me/stats")
    getMeStatsLocador(@Req() req: any) {
        const userId = req.user.sub;
        return this.userService.getMeStatsLocador(userId);
    }
}