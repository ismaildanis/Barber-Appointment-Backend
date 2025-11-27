import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentHolidayService } from './holiday.service';
import { DateRangeService } from './date-range.service';
import { ConflictValidator } from './validators/conflict.validator';
import { TimeRangeValidator } from './validators/time-range.validator';
import { WorkingHourValidator } from './validators/working-hours.validator';
import { WorkingHourService } from './working-hour.service';

@Module({
  controllers: [AppointmentController],
  providers: [
    WorkingHourService,
    AppointmentService, 
    AppointmentHolidayService, 
    DateRangeService, 
    ConflictValidator, 
    TimeRangeValidator, 
    WorkingHourValidator,
  ],
  exports: [AppointmentService]
})
export class AppointmentModule {}  
