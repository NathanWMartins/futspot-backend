import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateUserDto } from "src/classes/dto/user/update-user.dto";
import { User } from "src/classes/entity/user.entity";
import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt';
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class UserService {
    private supabase: SupabaseClient;
    private bucket: string;

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.bucket = process.env.SUPABASE_BUCKET_AVATARS || "avatars";

        if (!url || !key) {
            throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no backend.");
        }

        this.supabase = createClient(url, key);
    }

    async uploadFotoPerfil(userId: number, file: Express.Multer.File) {
        if (!file) {
            throw new Error("Arquivo não enviado.");
        }

        const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
        if (!allowed.has(file.mimetype)) {
            throw new BadRequestException("Formato inválido. Envie JPG, PNG ou WEBP.");
        }

        const ext = mimeToExt(file.mimetype);
        const path = `perfil/${userId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await this.supabase.storage
            .from(this.bucket)
            .upload(path, file.buffer, {
                contentType: file.mimetype,
                upsert: true,
            });

        if (uploadError) {
            throw new InternalServerErrorException(`Erro ao enviar foto: ${uploadError.message}`);
        }

        // URL pública (bucket precisa estar PUBLIC)
        const { data: publicData } = this.supabase.storage.from(this.bucket).getPublicUrl(path);
        const publicUrl = publicData?.publicUrl;

        if (!publicUrl) {
            throw new InternalServerErrorException("Não foi possível obter a URL pública da foto.");
        }

        // Salva no usuário
        await this.userRepository.update(userId, { fotoUrl: publicUrl });

        return { url: publicUrl };

    }

    async updateMe(userId: number, dto: UpdateUserDto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error("Usuário não encontrado.");
        }

        user.nome = dto.nome ?? user.nome;
        user.email = dto.email ?? user.email;
        user.telefone = dto.telefone ?? user.telefone;
        user.fotoUrl = dto.fotoUrl ?? user.fotoUrl;

        if (typeof dto.senha === "string" && dto.senha.trim().length > 0) {
            user.senhaHash = await bcrypt.hash(dto.senha, 10);
        }

        return this.userRepository.save(user);
    }

}

function mimeToExt(mime: string) {
    switch (mime) {
        case "image/jpeg":
            return "jpg";
        case "image/png":
            return "png";
        case "image/webp":
            return "webp";
        default:
            return "jpg";
    }
}