import { Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Matches,
    Min,
    ValidateNested,
} from "class-validator";

class HorarioDto {
    @IsIn([0, 1, 2, 3, 4, 5, 6])
    diaSemana: number;

    @IsBoolean()
    aberto: boolean;

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    inicio?: string;

    @IsOptional()
    @IsString()
    @Matches(/^\d{2}:\d{2}$/)
    fim?: string;
}

export class CreateLocalDto {
    @IsString()
    @IsNotEmpty()
    nome: string;

    @IsOptional()
    @IsString()
    descricao?: string;

    @IsString()
    @IsOptional()
    cep?: string;

    @IsString()
    @IsOptional()
    cidade?: string;

    @IsString()
    @IsNotEmpty()
    endereco: string;

    @IsString()
    numero?: string;

    @IsIn(["society", "futsal", "campo"])
    tipoLocal: "society" | "futsal" | "campo";

    @IsNumber()
    @Min(1)
    precoHora: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    fotos?: string[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => HorarioDto)
    horarios: HorarioDto[];
}
