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
    async create(@Body() dto: CreateBarberDto, @Req() req: any) {
        return await this.barberService.create(dto, req.admin!.sub);
    }

    @Get()
    @UseGuards(JwtAdminGuard)
    async findForAdmin(@Req() req: any) {
        return await this.barberService.findForAdmin(req.admin.shopId);
    }

    @Get(':slug')
    async findAllForShop(@Param('slug') slug: string) {
        return await this.barberService.findAllForShop(slug);
    }

    @Get(':slug/:id')
    @UseGuards(JwtAdminGuard)
    async findOne(@Req() req: any, @Param('id', ParseIntPipe) barberId: number,) {
        return await this.barberService.findOne(req.admin!.sub, barberId);
    }

    @Delete(':id')
    @UseGuards(JwtAdminGuard)
    async delete(@Req() req: any, @Param('id', ParseIntPipe) barberId: number) {
        return await this.barberService.delete(req.admin!.sub, barberId);
    }

    @Post('/image')
    @UseGuards(JwtBarberGuard)
    @UseInterceptors(FileInterceptor('file'))
    async uploadImage(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
        const fileName = `${req.barber.sub}-${Date.now()}.jpg`;
        const folder = `uploads/barbers`;
        const filePath = `${folder}/${fileName}`;

        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(filePath, file.buffer);

        return await this.barberService.uploadImage(req.barber.sub, filePath);
    }

    @Put('/image')
    @UseGuards(JwtBarberGuard)
    async deleteImage(@Req() req: any) {
        return await this.barberService.deleteImage(req.barber.sub);
    }
    
    @Put('update')
    @UseGuards(JwtBarberGuard)
    async updateBarber(@Req() req: any, @Body() dto: UpdateBarberDto) {
        return await this.barberService.updateBarber(req.barber.sub, dto); 
    }
    
    @Put(':id')
    @UseGuards(JwtAdminGuard)
    async isActive(@Req() req: any, @Param('id', ParseIntPipe) barberId: number, @Body() dto: ActivityBarberDto) {
        return await this.barberService.update(req.admin!.sub, barberId, dto); 
    }

}
