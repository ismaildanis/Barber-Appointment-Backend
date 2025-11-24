import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

import { ThrottlerModule } from '@nestjs/throttler';
import { AppointmentModule } from './appointment/appointment.module';
import { ServiceModule } from './service/service.module';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
