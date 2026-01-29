import { Body, Controller, Post, Get, UseGuards, Req, Res, Param, ParseIntPipe, Patch, Delete, Put, Query, BadRequestException } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtBarberGuard } from 'src/barber-auth/guards/jwt-barber-auth.guard';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { MarkAppointmentDto } from './dto/mark-appointment.dto';
import { BarberCancelDto } from './dto/barber-cancel.dto';
import { BreakDto } from './dto/break.dto';
import { Status } from '@prisma/client';
import { AppointmentRange } from './enum/appointment-range.enum';

@Controller('appointment')
export class AppointmentController 
{
    constructor(private appointmentService: AppointmentService ) {}

    @Get()
    @UseGuards(JwtAuthGuard)

    index(
        @Query('range') range: AppointmentRange,
        @Req() req: any
    )
    {
        return this.appointmentService.findAll(req.customer!.sub, range);
    }

    @Get('/admin')
    @UseGuards(JwtAdminGuard)

    indexAdmin(@Query('status') status: Status, @Query('date') date: string, @Req() req: any)
    {
        return this.appointmentService.indexAdmin(req.user!.sub, status, date)
    }

    @Get('barber')
    @UseGuards(JwtBarberGuard)

    findForBarber(@Query('date') date: string, @Req() req: any)
    {
        return this.appointmentService.findForBarber(req.user!.sub, date) 
    }
    @Get('barber-break')
    @UseGuards(JwtBarberGuard)
    getBreaks(@Req() req: any) {
        return this.appointmentService.getBreaks(req.user.sub);
    }

    @Get('barber/today')
    @UseGuards(JwtBarberGuard)

    findBarberTodayAppointments(@Req() req: any)
    {
        return this.appointmentService.findBarberTodayAppointments(req.user!.sub)
    }
    
    @Get('barber/:id')
    @UseGuards(JwtBarberGuard)

    findOneForBarber(@Param('id', ParseIntPipe) id: number, @Req() req: any)
    {
        return this.appointmentService.findOneForBarber(req.user!.sub, id)
    }


    
    @Get('available-dates')
    @UseGuards(JwtAuthGuard)

    getAvailableDates(@Req() req: any)
    {
        return this.appointmentService.getAvailableDates(req.user!.sub)
    }

    @Get('available-hours/:barberId')
    @UseGuards(JwtAuthGuard)
    getAvailableHours(@Param('barberId', ParseIntPipe) barberId: number, @Query('date') date: string, @Req() req: any)
    {
        if (!date) {
            throw new BadRequestException('Tarih zorunludur.');
        }
        return this.appointmentService.getAvailableHours(req.customer!.sub, barberId, date)
    }

    @Get('last')
    @UseGuards(JwtAuthGuard)
    lastAppt(@Req() req: any) {
        return this.appointmentService.lastCompleted(req.customer.sub);
    }

    @Get('last-scheduled')
    @UseGuards(JwtAuthGuard)
    lastApptScheduled(@Req() req: any) {
        return this.appointmentService.lastScheduled(req.customer.sub);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    show(@Param('id', ParseIntPipe) id:number, @Req() req: any )
    {
        return this.appointmentService.findOne(id, req.customer!.sub)
    }

    @Get('/admin/:id')
    @UseGuards(JwtAdminGuard)
    findOneAdmin(@Param('id', ParseIntPipe) id:number, @Req() req: any )
    {
        return this.appointmentService.findOneAdmin(id, req.user!.sub)
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreateAppointmentDto, @Req() req: any)
    {
        return this.appointmentService.create(dto, req.customer!.sub);
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAppointmentDto, @Req() req: any)
    {
        return this.appointmentService.update(dto, req.customer!.sub, id)
    }

    @Put('cancel/:id')
    @UseGuards(JwtAuthGuard)
    cancelAppointment(@Param('id', ParseIntPipe) id: number, @Req() req: any)
    {
        return this.appointmentService.cancelByCustomer(req.customer!.sub, id)
    }

    @Post('mark-cancel/:id')
    @UseGuards(JwtAdminGuard)
    markCancel(@Param('id', ParseIntPipe) id: number, @Body() dto: MarkAppointmentDto , @Req() req: any){
        return this.appointmentService.markCancel(req.admin!.sub, id, dto)
    }

    @Post('mark-completed/:id')   
    @UseGuards(JwtAdminGuard)
    markCompleted(@Param('id', ParseIntPipe) id: number, @Req() req: any){
        return this.appointmentService.markCompleted(req.admin.sub, id)
    }
    @Post('mark-no-show/:id')
    @UseGuards(JwtAdminGuard)
    markNoShow(@Param('id', ParseIntPipe) id: number, @Req() req: any){
        return this.appointmentService.markNoShow(req.user.sub, id)
    }

    @Post('barber-mark-completed/:id')   
    @UseGuards(JwtBarberGuard)
    markCompletedForBarber(@Param('id', ParseIntPipe) id: number, @Req() req: any){
        return this.appointmentService.markCompletedForBarber(req.barber.sub, id)
    }

    @Post('barber-mark-no-show/:id')   
    @UseGuards(JwtBarberGuard)
    markNoShowForBarber(@Param('id', ParseIntPipe) id: number, @Req() req: any){
        return this.appointmentService.markNoShowForBarber(req.barber.sub, id)
    }

    @Post('barber-cancel/:id')
    @UseGuards(JwtBarberGuard)
    cancelByBarber(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: BarberCancelDto
    ) {
        return this.appointmentService.cancelByBarber(req.barber.sub, id, dto);
    }

    @Post('barber-break')
    @UseGuards(JwtBarberGuard)
    addBreak(@Req() req: any, @Body() dto: BreakDto) {
        return this.appointmentService.addBreak(req.user.sub, dto);
    }

    @Delete('barber-break/:id')
    @UseGuards(JwtBarberGuard)
    deleteBreak(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        return this.appointmentService.deleteBreak(req.user.sub, id);
    }
}
