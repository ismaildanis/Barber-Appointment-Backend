import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { JwtAdminStrategy } from './strategies/jwt-admin.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JwtAdminGuard } from './guards/jwt-admin-auth.guard';
import { JwtAdminRefreshGuard } from './guards/jwt-admin-refresh.guard';
import { JwtAdminRefreshStrategy } from './strategies/jwt-admin-refresh.strategy';

@Module({
  imports: [
    JwtModule.register({
      global: false,
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN! },
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, JwtAdminStrategy, JwtAdminGuard, JwtAdminRefreshGuard, JwtAdminRefreshStrategy],
  exports: [JwtAdminGuard, AdminAuthService],
})
export class AdminAuthModule {}
