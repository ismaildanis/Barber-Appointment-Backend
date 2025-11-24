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
  ],
  controllers: [AppController, BarberController],
  providers: [AppService],
})
export class AppModule {}
