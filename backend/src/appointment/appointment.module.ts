import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { HolidayService } from './holiday.service';
import { DateRangeService } from './date-range.service';

@Module({
  controllers: [AppointmentController],
  providers: [AppointmentService, HolidayService, DateRangeService],
  exports: [AppointmentService]
})
export class AppointmentModule {}  
