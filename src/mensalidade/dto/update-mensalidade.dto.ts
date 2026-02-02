import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateMensalidadeDto {
  @IsOptional()
  @IsString()
  nomeResponsavel?: string;

  @IsOptional()
  @IsString()
  cpf?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsNumber()
  diaSemana?: number;

  @IsOptional()
  @IsString()
  horaInicio?: string;

  @IsOptional()
  @IsNumber()
  valor?: number;
}
