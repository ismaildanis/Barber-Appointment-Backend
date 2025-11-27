import { Module } from '@nestjs/common';
import { BarberAuthController } from './barber-auth.controller';
import { BarberAuthService } from './barber-auth.service';
import { JwtBarberGuard } from './guards/jwt-barber-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtBarberStrategy } from './strategies/jwt-barber.strategy';
import { JwtBarberRefreshGuard } from './guards/jwt-barber-refresh.guard';
import { JwtBarberRefreshStrategy } from './strategies/jwt-barber-refresh.strategy';

@Module({
    imports: [
        JwtModule.register({
            global: false,
            secret: process.env.JWT_SECRET!,
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN! },
        }),
    ],
    controllers: [BarberAuthController],
    providers: [BarberAuthService, JwtBarberGuard, JwtBarberStrategy, JwtBarberRefreshGuard, JwtBarberRefreshStrategy],
    exports: [JwtBarberGuard],
})
export class BarberAuthModule {}
