import { Controller, Post, Body, UnauthorizedException, UseGuards, Get, Req, NotFoundException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { BarberAuthService } from '../barber-auth/barber-auth.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';
import { JwtUnifiedGuard } from './guards/jwt-unified.guard';
import { JwtUnifiedRefreshGuard } from './guards/jwt-unified-refresh.guard';
import { ForgotDto } from './dto/forgot.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('unified-auth')
export class UnifiedAuthController {
  constructor(
    private readonly customerAuth: AuthService,
    private readonly barberAuth: BarberAuthService,
    private readonly adminAuth: AdminAuthService,
    private readonly jwt: JwtService
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60 } })
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

  @Post('forgot')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async forgot(@Body() dto: ForgotDto) {
    await Promise.all([
      this.customerAuth.forgot(dto),
      this.barberAuth.forgot(dto),
      this.adminAuth.forgot(dto),
    ]);
    return { message: 'Sıfırlama kodu e-posta ile gönderildi' };
  }
  
  @Post('verify-reset')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async verifyReset(@Body() dto: { email: string; code: string }) {
    const r =
      (await this.customerAuth.verifyReset(dto)) ||
      (await this.barberAuth.verifyReset(dto)) ||
      (await this.adminAuth.verifyReset(dto));
    if (r?.resetSessionId) return r;
    return { message: 'Sıfırlama kodu geçersiz' };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async resetPassword(@Body() dto: { resetSessionId: string; newPassword: string }) {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(dto.resetSessionId, { secret: process.env.RESET_SECRET });
    } catch {
      throw new UnauthorizedException('Reset token geçersiz veya süresi doldu');
    }
    if (payload.purpose !== 'password-reset') throw new UnauthorizedException();

    const role = payload.role;
    if (role === 'customer') return this.customerAuth.resetPassword(payload.email, dto.newPassword);
    if (role === 'barber')   return this.barberAuth.resetPassword(payload.email, dto.newPassword);
    if (role === 'admin')    return this.adminAuth.resetPassword(payload.email, dto.newPassword);
    throw new UnauthorizedException();
  }
  @UseGuards(JwtUnifiedGuard)
  @Post('change-password')
  @Throttle({ default: { limit: 5, ttl: 60 } })
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    const { sub, role } = req.user;
    if (role === 'customer') return await this.customerAuth.changePassword(sub, dto);
    if (role === 'barber')   return await this.barberAuth.changePassword(sub, dto);
    if (role === 'admin')    return await this.adminAuth.changePassword(sub, dto);
  }

  @Post('push/register')
  @UseGuards(JwtUnifiedGuard)
  async pushRegister(@Body() dto: { token: string }, @Req() req: any) {
    const { sub, role } = req.user;
    if (role === 'customer') return await this.customerAuth.pushRegister(sub, dto);
    if (role === 'barber')   return await this.barberAuth.pushRegister(sub, dto);
    if (role === 'admin')    return await this.adminAuth.pushRegister(sub, dto);
  }
}

