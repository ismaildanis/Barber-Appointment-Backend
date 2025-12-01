import { Controller, Post, Body, UnauthorizedException, UseGuards, Get, Req } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { BarberAuthService } from '../barber-auth/barber-auth.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { JwtUnifiedGuard } from './guards/jwt-unified.guard';
import { JwtUnifiedRefreshGuard } from './guards/jwt-unified-refresh.guard';

@Controller('unified-auth')
export class UnifiedAuthController {
  constructor(
    private readonly customerAuth: AuthService,
    private readonly barberAuth: BarberAuthService,
    private readonly adminAuth: AdminAuthService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const customer = await this.customerAuth.tryLogin(dto);
    if (customer) return customer;
    const barber = await this.barberAuth.tryLogin(dto);
    if (barber) return barber;
    const admin = await this.adminAuth.tryLogin(dto);
    if (admin) return admin;
    throw new UnauthorizedException('Email veya şifre yanlış');
  }
 
  @UseGuards(JwtUnifiedGuard)
  @Get('me')
  async me(@Req() req: any) {
    const { sub, role } = req.user;
    if (role === 'customer') return this.customerAuth.getMe(sub);
    if (role === 'barber')   return this.barberAuth.getMe(sub);
    if (role === 'admin')    return this.adminAuth.getMe(sub);
    throw new UnauthorizedException();
  }

  @UseGuards(JwtUnifiedRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: any) {
    const { sub, role } = req.user;
    if (role === 'customer') return this.customerAuth.refreshTokens(sub);
    if (role === 'barber')   return this.barberAuth.refreshTokens(sub);
    if (role === 'admin')    return this.adminAuth.refreshTokens(sub);
    throw new UnauthorizedException();
  }

  @UseGuards(JwtUnifiedGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const { sub, role } = req.user;
    if (role === 'customer') return this.customerAuth.logout(sub);
    if (role === 'barber')   return this.barberAuth.logout(sub);
    if (role === 'admin')    return this.adminAuth.logout(sub);
    throw new UnauthorizedException();
  }
}

