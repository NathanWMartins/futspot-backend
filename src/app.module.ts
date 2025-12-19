import { Module } from '@nestjs/common';
import { AuthModule } from './module/auth.module';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/classes/entity/user.entity';
import { ConfigModule } from '@nestjs/config';
import { Local } from './classes/entity/local.entity';
import { LocalModule } from './module/local.module';
import { HorarioFuncionamento } from './classes/entity/horario-funcionamento.entity';
import { UploadsModule } from './module/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false, },
      entities: [User, Local, HorarioFuncionamento],
      synchronize: true,
      autoLoadEntities: true,
    }),
    UploadsModule,
    AuthModule,
    LocalModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
