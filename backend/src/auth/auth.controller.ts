import { Body, Controller, Post, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
 
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDto) 
    {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() dto: LoginDto, @Res({passthrough: true}) res) 
    {
        return this.authService.login(dto).then((result) => {
            res.cookie("accessToken", result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 60 * 1000,
            });
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, 
            });

            return { message: result.message };
        });
    }

    @Post('refresh')
    @UseGuards(JwtRefreshGuard)
    async refresh(@Req() req, @Res({ passthrough: true }) res) {
        const user = req.user;

        const result = await this.authService.refreshTokens(user.id);

        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { message: "Yenilendi" };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    logout(@Req() req: any, @Res({passthrough: true}) res) 
    {
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        
        return this.authService.logout(req.customer.id);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Req() req: any) 
    {
        return this.authService.getMe(req.customer.id);
    }
}