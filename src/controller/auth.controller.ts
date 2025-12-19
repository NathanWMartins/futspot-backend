import { Body, Controller, Post } from "@nestjs/common";
import { RegisterDto } from "../classes/dto/user/register.dto";
import { LoginDto } from "../classes/dto/user/login.dto";
import { AuthService } from "../service/auth.service";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("register")
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post("login")
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
}
