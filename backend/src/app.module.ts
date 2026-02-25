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
import { APP_GUARD } from '@nestjs/core';
import { CustomerModule } from './customer/customer.module';
import { ShopModule } from './shop/shop.module';
import { UnifiedAuthController } from './auth/unified-auth.controller';
import { UploadModule } from './upload/upload.module';
import { CampaignModule } from './campaign/campaign.module';
import { GameModule } from './game/game.module';
import { RewardModule } from './reward/reward.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,

    ConfigModule.forRoot({
      isGlobal: true,
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
    ShopModule,
    UploadModule,
    CampaignModule,
    GameModule,
    RewardModule
  ],
  controllers: [AppController, BarberController, BarberAuthController, WorkingHourController],
  providers: [
    AppService, 
    BarberAuthService,
    {provide: APP_GUARD, useClass: ThrottlerGuard},
  ],
})
export class AppModule {}
