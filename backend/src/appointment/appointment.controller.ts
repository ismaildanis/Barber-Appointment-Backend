import { Body, Controller, Post, Get, UseGuards, Req, Res, Param, ParseIntPipe, Patch, Delete, Put } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentService } from './appointment.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

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




}
