import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../user/dto/login.dto';
import { RegisterDto } from '../user/dto/register.dto';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    private signToken(user: User) {
        const payload = {
            sub: user.id,
            email: user.email,
            tipoUsuario: user.tipoUsuario,
        };

        return this.jwtService.sign(payload);
    }

    async register(dto: RegisterDto) {
        const existing = await this.userRepo.findOne({
            where: { email: dto.email },
        });

        if (existing) {
            throw new BadRequestException('Este e-mail já está cadastrado.');
        }

        const senhaHash = await bcrypt.hash(dto.senha, 10);

        const user = this.userRepo.create({
            nome: dto.nome,
            email: dto.email,
            senhaHash,
            tipoUsuario: dto.tipoUsuario,
            fotoUrl: dto.fotoUrl,
        });

        await this.userRepo.save(user);

        const access_token = this.signToken(user);

        return {
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                tipoUsuario: user.tipoUsuario,
                fotoUrl: user.fotoUrl,
            },
            access_token,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email },
            select: ["id", "nome", "email", "tipoUsuario", "fotoUrl", "senhaHash"],
        });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado.');
        }

        if (user.tipoUsuario !== dto.tipoUsuario) {
            throw new BadRequestException(
                `Este e-mail está cadastrado como ${user.tipoUsuario}, não como ${dto.tipoUsuario}.`,
            );
        }

        const senhaOk = await bcrypt.compare(dto.senha, user.senhaHash);
        if (!senhaOk) {
            throw new BadRequestException('Senha inválida.');
        }

        const access_token = this.signToken(user);

        return {
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                tipoUsuario: user.tipoUsuario,
                fotoUrl: user.fotoUrl,
            },
            access_token,
        };
    }
}
