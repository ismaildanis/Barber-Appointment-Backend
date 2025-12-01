import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Req, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtUnifiedGuard } from 'src/auth/guards/jwt-unified.guard';

@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

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
