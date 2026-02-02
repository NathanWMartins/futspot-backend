import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mensalidade } from 'src/mensalidade/mensalidade.entity';
import { MensalidadesService } from 'src/mensalidade/mensalidade.service';
import { MensalidadesController } from 'src/mensalidade/mensalidades.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Mensalidade])],
  controllers: [MensalidadesController],
  providers: [MensalidadesService],
})
export class MensalidadesModule {}
