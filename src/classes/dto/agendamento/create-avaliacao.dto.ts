import { IsInt, IsOptional, IsString, Max, Min, IsNumber } from "class-validator";

export class CreateAvaliacaoDto {
    @IsInt()
    localId: number;

    @IsInt()
    agendamentoId: number;

    @IsNumber()
    @Min(0)
    @Max(5)
    nota: number;

    @IsOptional()
    @IsString()
    comentario?: string;
}
