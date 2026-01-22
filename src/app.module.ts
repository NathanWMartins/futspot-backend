import { Module } from '@nestjs/common';
import { AuthModule } from './module/auth.module';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { ConfigModule } from '@nestjs/config';
import { Local } from './local/local.entity';
import { LocalModule } from './module/local.module';
import { HorarioFuncionamento } from './agendamentos/horario-funcionamento.entity';
import { UploadsModule } from './module/uploads.module';
import { AgendamentosModule } from './module/agendamentos.module';
import { LocadoresModule } from './module/locadores.module';
import { UserModule } from './module/user.module';
import { AvaliacaoModule } from './module/avaliacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      url: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
      extra: {
        ssl: process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: true }
          : { rejectUnauthorized: false },
      },
      synchronize: true,
      autoLoadEntities: true,
    }),
    UserModule,
    AvaliacaoModule,
    AgendamentosModule,
    LocadoresModule,
    UploadsModule,
    AuthModule,
    LocalModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
