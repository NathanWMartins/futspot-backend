import { IsDateString, IsInt, Matches } from "class-validator";

export class CreateAgendamentoDto {
    @IsInt()
    localId: number;

    @IsDateString()
    data: string; 

    @Matches(/^\d{2}:\d{2}$/)
    inicio: string;
}
