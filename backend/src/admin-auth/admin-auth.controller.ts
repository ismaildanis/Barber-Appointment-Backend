import { Body, Controller, Post, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAdminGuard } from './guards/jwt-admin-auth.guard';
import { JwtAdminRefreshGuard } from './guards/jwt-admin-refresh.guard';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.adminAuthService.login(dto);

    return {
      message: result.message,
      role: result.role,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('refresh')
  @UseGuards(JwtAdminRefreshGuard)
  async refresh(@Req() req) {
    const adminId = req.admin.id;

    const result = await this.adminAuthService.refreshTokens(adminId);

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('logout')
  @UseGuards(JwtAdminGuard)
  logout(@Req() req: any) {
    return this.adminAuthService.logout(req.admin.sub);
  }

  @Get('me')
  @UseGuards(JwtAdminGuard)
  getMe(@Req() req: any) {
    return this.adminAuthService.getMe(req.admin.sub);
  }
}
