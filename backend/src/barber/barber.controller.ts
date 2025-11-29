import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { BarberService } from './barber.service';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { CreateBarberDto } from './dto/create-barber.dto';
import { JwtBarberGuard } from 'src/barber-auth/guards/jwt-barber-auth.guard';
import { ActivityBarberDto } from './dto/activity-barber.dto';

@Controller('barber')
export class BarberController {
    constructor(private barberService: BarberService) {}

    @Post()
    @UseGuards(JwtAdminGuard)
    create(@Body() dto: CreateBarberDto, @Req() req: any) {
        return this.barberService.create(dto, req.admin!.sub);
    }

    @Get()
    @UseGuards(JwtAdminGuard)
    findAll(@Req() req: any) {
        return this.barberService.findAll(req.admin!.sub);
    }

    @Get(':id')
    @UseGuards(JwtAdminGuard)
    findOne(@Req() req: any, @Param('id', ParseIntPipe) barberId: number) {
        return this.barberService.findOne(req.admin!.sub, barberId);
    }

    @Delete(':id')
    @UseGuards(JwtAdminGuard)
    delete(@Req() req: any, @Param('id', ParseIntPipe) barberId: number) {
        return this.barberService.delete(req.admin!.sub, barberId);
    }

    @Put(':id')
    @UseGuards(JwtAdminGuard)
    isActive(@Req() req: any, @Param('id', ParseIntPipe) barberId: number, @Body() dto: ActivityBarberDto) {
        return this.barberService.update(req.admin!.sub, barberId, dto); 
    }
}
