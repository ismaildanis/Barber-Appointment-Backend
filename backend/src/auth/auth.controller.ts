import { Body, Controller, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
 
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}
    @Get("test")
    test() {
        return { message: "Backend çalışıyor 🚀" };
    }
    @Post('register')
    register(@Body() dto: RegisterDto) 
    {
        return this.authService.register(dto);
    }

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const result = await this.authService.login(dto);

        return {
            message: result.message,
            role: result.role,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        };
    }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    async refresh(@Req() req) {
        const result = await this.authService.refreshTokens(req.customer.id);

        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(@Req() req: any) 
    {
        return this.authService.logout(req.customer.id);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Req() req: any) 
    {
        return this.authService.getMe(req.customer.id);
    }
}
