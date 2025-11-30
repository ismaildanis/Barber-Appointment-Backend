import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { UnifiedAuthController } from './unified-auth.controller';
import { BarberAuthModule } from 'src/barber-auth/barber-auth.module';
import { AdminAuthModule } from 'src/admin-auth/admin-auth.module';
import { JwtUnifiedRefreshGuard } from './guards/jwt-unified-refresh.guard';
import { JwtUnifiedGuard } from './guards/jwt-unified.guard';
import { JwtUnifiedRefreshStrategy } from './strategies/jwt-unified-refresh.strategy';
import { JwtUnifiedStrategy } from './strategies/jwt-unified-strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    BarberAuthModule,
    AdminAuthModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN! },
    }),
  ],
  controllers: [AuthController, UnifiedAuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtRefreshGuard,
    JwtAuthGuard,
    JwtUnifiedRefreshGuard,
    JwtUnifiedGuard,
    JwtUnifiedRefreshStrategy,
    JwtUnifiedStrategy
  ],
  exports: [JwtRefreshGuard, JwtAuthGuard, JwtUnifiedRefreshGuard, JwtUnifiedGuard, JwtUnifiedStrategy, JwtUnifiedRefreshStrategy, ],
})
export class AuthModule {}
