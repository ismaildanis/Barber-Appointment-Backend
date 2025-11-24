import { Module } from '@nestjs/common';
import { BarberService } from './barber.service';

@Module({
  providers: [BarberService]
})
export class BarberModule {}
