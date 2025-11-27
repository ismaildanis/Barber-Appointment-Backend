import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { AppointmentHolidayService } from './holiday.service';
import { DateRangeService } from './date-range.service';

@Module({
  controllers: [AppointmentController],
  providers: [AppointmentService, AppointmentHolidayService, DateRangeService],
  exports: [AppointmentService]
})
export class AppointmentModule {}  
