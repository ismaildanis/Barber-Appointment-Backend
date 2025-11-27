import { Body, Controller, Post, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAdminGuard } from './guards/jwt-admin-auth.guard';
import { JwtAdminRefreshGuard } from './guards/jwt-admin-refresh.guard';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res) {
    return this.adminAuthService.login(dto).then((result) => {
        res.cookie("adminAccessToken", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
        });
        res.cookie("adminRefreshToken", result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        return { message: result.message };
    });
  }

  @Post('refresh')
  @UseGuards(JwtAdminRefreshGuard)
  async refresh(@Req() req, @Res({ passthrough: true }) res) {
    const adminId = req.admin.id;

    const result = await this.adminAuthService.refreshTokens(adminId);

    res.cookie('adminAccessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('adminRefreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Yenilendi' };
  }


  @Post('logout')
  @UseGuards(JwtAdminGuard)
  logout(@Req() req: any, @Res({ passthrough: true }) res) {
    res.clearCookie('adminAccessToken');
    res.clearCookie('adminRefreshToken');
    return this.adminAuthService.logout(req.admin.id);
  }

  @Get('me')
  @UseGuards(JwtAdminGuard)
  getMe(@Req() req: any) {
    return this.adminAuthService.getMe(req.admin.id);
  }
}
