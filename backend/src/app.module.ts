import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

import { ThrottlerModule } from '@nestjs/throttler';
import { AppointmentModule } from './appointment/appointment.module';
import { ServiceModule } from './service/service.module';
import { BarberController } from './barber/barber.controller';
import { BarberModule } from './barber/barber.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { BarberAuthController } from './barber-auth/barber-auth.controller';
import { BarberAuthService } from './barber-auth/barber-auth.service';
import { BarberAuthModule } from './barber-auth/barber-auth.module';
import { HolidayModule } from './holiday/holiday.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,

    ThrottlerModule.forRoot([
      {
        ttl: 60,   // 60 saniyede
        limit: 50, // en fazla 50 istek
      },
    ]),

    AppointmentModule,
    ServiceModule,
    BarberModule,
    AdminAuthModule,
    BarberAuthModule,
    HolidayModule,
  ],
  controllers: [AppController, BarberController, BarberAuthController],
  providers: [AppService, BarberAuthService],
})
export class AppModule {}
