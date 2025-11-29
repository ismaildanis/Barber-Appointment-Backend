import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { BarberAuthService } from '../barber-auth/barber-auth.service';
import { AdminAuthService } from '../admin-auth/admin-auth.service';

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
}
