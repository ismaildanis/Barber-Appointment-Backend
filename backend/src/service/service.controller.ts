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
  async create(@Body() dto: CreateServiceDto, @Req() req: any) {
    return await this.serviceService.create(req.admin!.sub, dto);
  }

  @Get()
  @UseGuards(JwtAdminGuard)
  async findAllForAdmin(@Req() req: any) {
    return await this.serviceService.findAllForAdmin(req.admin!.sub);
  }

  @Get(':slug')
  async findAll(@Param('slug') slug: string) {
    return await this.serviceService.findAll(slug);
  }

  @Get(':id')
  @UseGuards(JwtAdminGuard)
  async findOne(@Param('id', ParseIntPipe) serviceId: number, @Req() req: any) {
    return await this.serviceService.findOne(req.admin!.sub, serviceId);
  }

  @Post('/image/:id')
  @UseGuards(JwtAdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(@Req() req: any, @Param('id', ParseIntPipe) serviceId: number, @UploadedFile() file: Express.Multer.File) {
      const fileName = `service-${Date.now()}.jpg`;
      const folder = `uploads/services`;
      const filePath = `${folder}/${fileName}`;

      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(filePath, file.buffer);

      return await this.serviceService.uploadImage(req.admin.shopId, serviceId, filePath);
  }

  @Put('/image/:id')
  @UseGuards(JwtAdminGuard)
  async deleteImage(@Req() req: any, @Param('id', ParseIntPipe) serviceId: number) {
      return await this.serviceService.deleteImage(req.admin.shopId, serviceId);
  }

  @Put(':id')
  @UseGuards(JwtAdminGuard)
  async update(@Param('id', ParseIntPipe) serviceId: number, @Body() dto: UpdateServiceDto, @Req() req: any) {
    return await this.serviceService.update(req.admin!.sub, serviceId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAdminGuard)
  async delete(@Param('id', ParseIntPipe) serviceId: number, @Req() req: any) {
    return await this.serviceService.delete(req.admin!.shopId, serviceId);
  }
}
