import { Body, Controller, Post, Get, UseGuards, Req, Res, Param, ParseIntPipe, Patch, Delete, Put, Query, BadRequestException } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtBarberGuard } from 'src/barber-auth/guards/jwt-barber-auth.guard';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { MarkAppointmentDto } from './dto/mark-appointment.dto';
import { BarberCancelDto } from './dto/barber-cancel.dto';

@Controller('appointment')
export class AppointmentController 
{
    constructor(private appointmentService: AppointmentService ) {}

    @Get()
    @UseGuards(JwtAuthGuard)

    index(@Req() req: any)
    {
        return this.appointmentService.findAll(req.customer!.id)
    }

    @Get('barber')
    @UseGuards(JwtBarberGuard)

    findForBarber(@Req() req: any)
    {
        return this.appointmentService.findForBarber(req.barber!.id)
    }

    
    @Get('available-dates')
    @UseGuards(JwtAuthGuard)
    getAvailableDates(@Req() req: any)
    {
        return this.appointmentService.getAvailableDates(req.customer!.id)
    }

    @Get('available-hours/:barberId')
    @UseGuards(JwtAuthGuard)

    getAvailableHours(@Param('barberId', ParseIntPipe) barberId: number, @Query('date') date: string, @Req() req: any)
    {
        if (!date) {
            throw new BadRequestException('Tarih zorunludur.');
        }
        return this.appointmentService.getAvailableHours(req.customer!.id, barberId, date)
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    show(@Param('id', ParseIntPipe) id:number, @Req() req: any )
    {
        return this.appointmentService.findOne(id, req.customer!.id)
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreateAppointmentDto, @Req() req: any)
    {
        return this.appointmentService.create(dto, req.customer!.id);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAppointmentDto, @Req() req: any)
    {
        return this.appointmentService.update(dto, req.customer!.id, id)
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    delete(@Param('id', ParseIntPipe) id: number, @Req() req: any)
    {
        return this.appointmentService.delete(req.customer!.id, id)
    }

    @Post('mark-cancel/:id')
    @UseGuards(JwtAdminGuard)
    markCancel(@Param('id', ParseIntPipe) id: number, @Body() dto: MarkAppointmentDto , @Req() req: any){
        return this.appointmentService.markCancel(req.admin!.id, id, dto)
    }
    @Post('mark-completed/:id')
    @UseGuards(JwtAdminGuard)
    markCompleted(@Param('id', ParseIntPipe) id: number, @Req() req: any){
        return this.appointmentService.markCompleted(req.admin!.id, id)
    }
    @Post('mark-no-show/:id')
    @UseGuards(JwtAdminGuard)
    markNoShow(@Param('id', ParseIntPipe) id: number, @Req() req: any){
        return this.appointmentService.markNoShow(req.admin!.id, id)
    }

    @Post('barber-cancel/:id')
    @UseGuards(JwtBarberGuard)
    cancelByBarber(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: BarberCancelDto
    ) {
    return this.appointmentService.cancelByBarber(req.barber.id, id, dto);
    }


}
