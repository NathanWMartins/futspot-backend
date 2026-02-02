import { IsNumber, IsString } from 'class-validator';

export class CreateMensalidadeDto {
  @IsString()
  nomeResponsavel: string;

  @IsString()
  cpf: string;

  @IsString()
  celular: string;

  @IsNumber()
  diaSemana: number;

  @IsString()
  horaInicio: string;

  @IsNumber()
  valor: number;

  @IsNumber()
  localId: number;
}
