import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum TipoUsuarioEnum {
    JOGADOR = 'jogador',
    LOCADOR = 'locador',
}

export class RegisterDto {
    @IsString()
    nome: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    senha: string;

    @IsEnum(TipoUsuarioEnum)
    tipoUsuario: TipoUsuarioEnum;
}
