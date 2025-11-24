import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { BarberAuthService } from './barber-auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtBarberGuard } from './guards/jwt-barber-auth.guard';

@Controller('barber-auth')
export class BarberAuthController {
    constructor(private barberAuthService: BarberAuthService) {}

    @Post('login')
    login(@Body() dto: LoginDto, @Res({passthrough: true}) res) {
        return this.barberAuthService.login(dto).then((result) => {

            res.cookie("barberAccessToken", result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000,
            });

            res.cookie("barberRefreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, 
            });

            return ({ message: result.message })
        })
    }

    @Post('logout')
    @UseGuards(JwtBarberGuard)
    logout(@Req() req: any, @Res({passthrough: true}) res) {
        res.clearCookie('barberAccessToken');
        res.clearCookie('barberRefreshToken');
        return this.barberAuthService.logout(req.barber.id);
    }

    @Get('me')
    @UseGuards(JwtBarberGuard)
    getMe(@Req() req: any) {
        return this.barberAuthService.getMe(req.barber.id);
    }
}
