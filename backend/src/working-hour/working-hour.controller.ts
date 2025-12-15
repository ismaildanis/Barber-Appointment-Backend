import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { WorkingHourService } from './working-hour.service';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { JwtBarberGuard } from 'src/barber-auth/guards/jwt-barber-auth.guard';

@Controller('working-hours')
export class WorkingHourController {
    constructor( private workingHourService: WorkingHourService) {}

    @Get()
    @UseGuards(JwtBarberGuard)
    async getWorkingHours(@Req() req: any) {
        return await this.workingHourService.getDailyHours(req.barber.sub);
    }
    @Post()
    @UseGuards(JwtBarberGuard)
    async createWorkingHours(@Req() req: any, @Body() dto: CreateWorkingHourDto) {
        return await this.workingHourService.createWorkingHours(req.barber.sub, dto);
    }
    @Put(':id')
    @UseGuards(JwtBarberGuard)
    async updateWorkingHours(@Param('id') id: number, @Req() req: any, @Body() dto: UpdateWorkingHourDto) {
        return await this.workingHourService.updateWorkingHours(req.barber.sub, dto, id);
    }
    @Delete(':id')
    @UseGuards(JwtBarberGuard)
    async deleteWorkingHours(@Param('id') id: number, @Req() req: any) {
        return await this.workingHourService.deleteWorkingHours(req.barber.sub, id);
    }
}
