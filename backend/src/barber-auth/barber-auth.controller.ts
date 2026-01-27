import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { BarberAuthService } from './barber-auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtBarberGuard } from './guards/jwt-barber-auth.guard';
import { JwtBarberRefreshGuard } from './guards/jwt-barber-refresh.guard';

@Controller('barber-auth')
export class BarberAuthController {
    constructor(private barberAuthService: BarberAuthService) {}

    @Post('login')
    async login(@Body() dto: LoginDto) {
        const result = await this.barberAuthService.login(dto);
        return {
            message: result.message,
            role: result.role,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
        };
    }

    @Post('refresh')
    @UseGuards(JwtBarberRefreshGuard)
    async refresh(@Req() req) {
        const barberId = req.barber.id;

        const result = await this.barberAuthService.refreshTokens(barberId);

        return {
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        };
    }

    @Post('logout')
    @UseGuards(JwtBarberGuard)
    logout(@Req() req: any) {
        return this.barberAuthService.logout(req.barber.sub);
    }

    @Get('me')
    @UseGuards(JwtBarberGuard)
    getMe(@Req() req: any) {
        return this.barberAuthService.getMe(req.barber.sub);
    }
}
