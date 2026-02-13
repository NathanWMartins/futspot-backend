import { Module } from '@nestjs/common';
import { AuthModule } from './module/auth.module';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LocalModule } from './module/local.module';
import { UploadsModule } from './module/uploads.module';
import { AgendamentosModule } from './module/agendamentos.module';
import { LocadoresModule } from './module/locadores.module';
import { UserModule } from './module/user.module';
import { AvaliacaoModule } from './module/avaliacao.module';
import { NotificacaoModule } from './module/notificacao.module';
import { MensalidadesModule } from './module/mensalidades.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),    
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      extra: {
        ssl: { rejectUnauthorized: false },
      },
      synchronize: true,
      autoLoadEntities: true,
    }),
    UserModule,
    AvaliacaoModule,
    AgendamentosModule,
    LocadoresModule,
    NotificacaoModule,
    UploadsModule,
    AuthModule,
    LocalModule,
    MensalidadesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
