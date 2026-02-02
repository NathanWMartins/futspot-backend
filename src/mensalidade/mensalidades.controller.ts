import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { CreateMensalidadeDto } from './dto/create-mensalidade.dto';
import { UpdateMensalidadeDto } from './dto/update-mensalidade.dto';
import { MensalidadesService } from './mensalidade.service';

@Controller('mensalidades')
export class MensalidadesController {
  constructor(private readonly service: MensalidadesService) {}

  @Post()
  create(@Body() dto: CreateMensalidadeDto) {
    return this.service.create(dto);
  }

  @Get('local/:localId')
  findByLocal(@Param('localId') localId: string) {
    return this.service.findByLocal(Number(localId));
  }

  @Patch(':id/update')
  update(@Param('id') id: string, @Body() dto: UpdateMensalidadeDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
