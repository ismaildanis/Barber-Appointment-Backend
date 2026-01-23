import { Module } from '@nestjs/common';
import { HolidayController } from './holiday.controller';
import { HolidayService } from './holiday.service';
import { PushService } from 'src/appointment/push-notifications.service';

@Module({
  controllers: [HolidayController],
  providers: [HolidayService, PushService]
})
export class HolidayModule {}
