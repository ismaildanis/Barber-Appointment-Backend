import { Module } from '@nestjs/common';
import { BarberAuthController } from './barber-auth.controller';
import { BarberAuthService } from './barber-auth.service';
import { JwtBarberGuard } from './guards/jwt-barber-auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtBarberStrategy } from './strategies/jwt-barber.strategy';

@Module({
    imports: [
        JwtModule.register({
            global: false,
            secret: process.env.JWT_SECRET!,
            signOptions: { expiresIn: process.env.JWT_EXPIRES_IN! },
        }),
    ],
    controllers: [BarberAuthController],
    providers: [BarberAuthService, JwtBarberGuard, JwtBarberStrategy],
    exports: [JwtBarberGuard],
})
export class BarberAuthModule {}
