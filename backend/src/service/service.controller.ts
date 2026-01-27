import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Req, ParseIntPipe, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService, private readonly config: ConfigService) {}

  @Post()
  @UseGuards(JwtAdminGuard)
  create(@Body() dto: CreateServiceDto, @Req() req: any) {
    return this.serviceService.create(req.admin!.sub, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.serviceService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAdminGuard)
  findOne(@Param('id', ParseIntPipe) serviceId: number, @Req() req: any) {
    return this.serviceService.findOne(req.admin!.sub, serviceId);
  }

  @Post('/image/:id')
  @UseGuards(JwtAdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadImage(@Req() req: any, @Param('id', ParseIntPipe) serviceId: number, @UploadedFile() file: Express.Multer.File) {
      const fileName = `service-${Date.now()}.jpg`;
      const folder = `uploads/services`;
      const filePath = `${folder}/${fileName}`;

      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(filePath, file.buffer);

      return this.serviceService.uploadImage(req.admin.sub, serviceId, filePath);
  }

  @Put('/image/:id')
  @UseGuards(JwtAdminGuard)
  deleteImage(@Req() req: any, @Param('id', ParseIntPipe) serviceId: number) {
      return this.serviceService.deleteImage(req.admin.sub, serviceId);
  }

  @Put(':id')
  @UseGuards(JwtAdminGuard)
  update(@Param('id', ParseIntPipe) serviceId: number, @Body() dto: UpdateServiceDto, @Req() req: any) {
    return this.serviceService.update(req.admin!.sub, serviceId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAdminGuard)
  delete(@Param('id', ParseIntPipe) serviceId: number, @Req() req: any) {
    return this.serviceService.delete(req.admin!.sub, serviceId);
  }
}
