import { HttpException, Injectable } from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

@Injectable()
export class UploadsService {
    private supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    async uploadLocalFoto(file: Express.Multer.File) {
        const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
        const path = `locais/${randomUUID()}.${ext}`;
        const bucket = process.env.SUPABASE_BUCKET_LOCAIS ?? "locais";

        const { error } = await this.supabase.storage
            .from(bucket || "locais")
            .upload(path, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            const status = Number((error as any).statusCode) || 500;
            throw new HttpException(error.message || "Erro no upload.", status);
        }

        const { data } = this.supabase.storage
            .from(bucket || "locais")
            .getPublicUrl(path);

        return data.publicUrl;
    }
}
