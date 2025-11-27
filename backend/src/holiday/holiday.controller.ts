import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { HolidayService } from './holiday.service';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';

@Controller('holiday')
@UseGuards(JwtAdminGuard)
export class HolidayController {
    constructor(private holidayService: HolidayService) {}

    @Post()
    createHoliday(@Body() dto: CreateHolidayDto, @Req() req: any) {
        return this.holidayService.create(req.admin.id, dto);
    }

    @Get()
    getAll(@Req() req: any) {
        return this.holidayService.findAll(req.admin.id);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.holidayService.remove(req.admin.id, id);
    }
}
