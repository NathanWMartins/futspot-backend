import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { TipoUsuarioEnum } from './register.dto';

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    senha: string;

    @IsEnum(TipoUsuarioEnum)
    tipoUsuario: TipoUsuarioEnum;
}
