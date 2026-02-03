import { Module } from '@nestjs/common';
import { BarberService } from './barber.service';
import { BarberController } from './barber.controller';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [BarberController],
  providers: [BarberService],
  exports: [BarberService]
})
export class BarberModule {}
