import { Controller, Post, UseInterceptors, UploadedFile, UseGuards } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { AuthGuard } from "@nestjs/passport";
import { UploadsService } from "./uploads.service";

@Controller("uploads")
@UseGuards(AuthGuard("jwt"))
export class UploadsController {
    constructor(private uploadsService: UploadsService) { }

    @Post("foto")
    @UseInterceptors(FileInterceptor("file"))
    async upload(@UploadedFile() file: Express.Multer.File) {
        const url = await this.uploadsService.uploadLocalFoto(file);
        return { url };
    }
}