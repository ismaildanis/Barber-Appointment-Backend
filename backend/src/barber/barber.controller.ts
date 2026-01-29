import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { BarberService } from './barber.service';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { CreateBarberDto } from './dto/create-barber.dto';
import { JwtBarberGuard } from 'src/barber-auth/guards/jwt-barber-auth.guard';
import { ActivityBarberDto } from './dto/activity-barber.dto';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateBarberDto } from './dto/update-barber.dto';

@Controller('barber')
export class BarberController {
    constructor(private barberService: BarberService) {}

    @Post()
    @UseGuards(JwtAdminGuard)
    create(@Body() dto: CreateBarberDto, @Req() req: any) {
        return this.barberService.create(dto, req.admin!.sub);
    }

    @Get()
    findAll() {
        return this.barberService.findAll();
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

    @Post('/image')
    @UseGuards(JwtBarberGuard)
    @UseInterceptors(FileInterceptor('file'))
    uploadImage(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
        const fileName = `${req.barber.sub}-${Date.now()}.jpg`;
        const folder = `uploads/barbers`;
        const filePath = `${folder}/${fileName}`;

        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(filePath, file.buffer);

        return this.barberService.uploadImage(req.barber.sub, filePath);
    }

    @Put('/image')
    @UseGuards(JwtBarberGuard)
    deleteImage(@Req() req: any) {
        return this.barberService.deleteImage(req.barber.sub);
    }
    
    @Put('update')
    @UseGuards(JwtBarberGuard)
    updateBarber(@Req() req: any, @Body() dto: UpdateBarberDto) {
        return this.barberService.updateBarber(req.barber.sub, dto); 
    }
    
    @Put(':id')
    @UseGuards(JwtAdminGuard)
    isActive(@Req() req: any, @Param('id', ParseIntPipe) barberId: number, @Body() dto: ActivityBarberDto) {
        return this.barberService.update(req.admin!.sub, barberId, dto); 
    }

}
