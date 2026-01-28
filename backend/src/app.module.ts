import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppointmentModule } from './appointment/appointment.module';
import { ServiceModule } from './service/service.module';
import { BarberController } from './barber/barber.controller';
import { BarberModule } from './barber/barber.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { BarberAuthController } from './barber-auth/barber-auth.controller';
import { BarberAuthService } from './barber-auth/barber-auth.service';
import { BarberAuthModule } from './barber-auth/barber-auth.module';
import { HolidayModule } from './holiday/holiday.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config'; 
import { WorkingHourController } from './working-hour/working-hour.controller';
import { WorkingHourModule } from './working-hour/working-hour.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { APP_GUARD } from '@nestjs/core';
import { CustomerModule } from './customer/customer.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      defaults: {
        from: `"SALON BARBER" <${process.env.SMTP_USER}>`,
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60,   // 60 saniyede
        limit: 50, // en fazla 50 istek
      },
    ]),
    WorkingHourModule,
    AppointmentModule,
    ServiceModule,
    BarberModule,
    AdminAuthModule,
    BarberAuthModule,
    HolidayModule,
    CustomerModule,
  ],
  controllers: [AppController, BarberController, BarberAuthController, WorkingHourController],
  providers: [
    AppService, 
    BarberAuthService,
    {provide: APP_GUARD, useClass: ThrottlerGuard},
  ],
})
export class AppModule {}
