import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentHolidayService } from './holiday.service';
import { DateRangeService } from './date-range.service';
import { ConflictValidator } from './validators/conflict.validator';
import { TimeRangeValidator } from './validators/time-range.validator';
import { WorkingHourValidator } from './validators/working-hours.validator';
import { WorkingHourService } from './working-hour.service';
import { AppointmentCron } from './cron/appointment.cron';
import { BarberBreakCron } from './cron/barber-break.cron';
import { PushService } from './push-notifications.service';
import { RewardModule } from 'src/reward/reward.module';

@Module({
  imports: [RewardModule],
  controllers: [AppointmentController],
  providers: [
    WorkingHourService,
    AppointmentService,  
    AppointmentHolidayService, 
    DateRangeService, 
    ConflictValidator, 
    TimeRangeValidator, 
    WorkingHourValidator,
    AppointmentCron,
    BarberBreakCron,
    PushService
  ],
  exports: [AppointmentService, PushService]
})
export class AppointmentModule {}  
