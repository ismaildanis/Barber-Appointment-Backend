import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { BarberService } from './barber.service';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { CreateBarberDto } from './dto/create-barber.dto';

@Controller('barber')
export class BarberController {
    constructor(private barberService: BarberService) {}

    @Post()
    @UseGuards(JwtAdminGuard)
    create(@Body() dto: CreateBarberDto, @Req() req: any) {
        return this.barberService.create(dto, req.admin!.id);
    }

    @Get()
    @UseGuards(JwtAdminGuard)
    findAll(@Req() req: any) {
        return this.barberService.findAll(req.admin!.id);
    }

    @Get(':id')
    @UseGuards(JwtAdminGuard)
    findOne(@Req() req: any, @Param('id', ParseIntPipe) barberId: number) {
        return this.barberService.findOne(req.admin!.id, barberId);
    }

    @Delete(':id')
    @UseGuards(JwtAdminGuard)
    delete(@Req() req: any, @Param('id', ParseIntPipe) barberId: number) {
        return this.barberService.delete(req.admin!.id, barberId);
    }
}
