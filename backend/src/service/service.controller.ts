import { Controller, Get, Post, Body, Patch, Param, Delete, Put, Req, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ServiceService } from './service.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';

@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Post()
  @UseGuards(JwtAdminGuard)
  create(@Body() dto: CreateServiceDto, @Req() req: any) {
    return this.serviceService.create(req.admin!.id, dto);
  }

  @Get()
  @UseGuards(JwtAdminGuard)
  findAll(@Req() req: any) {
    return this.serviceService.findAll(req.admin!.id);
  }

  @Get(':id')
  @UseGuards(JwtAdminGuard)
  findOne(@Param('id', ParseIntPipe) serviceId: number, @Req() req: any) {
    return this.serviceService.findOne(req.admin!.id, serviceId);
  }

  @Put(':id')
  @UseGuards(JwtAdminGuard)
  update(@Param('id', ParseIntPipe) serviceId: number, @Body() dto: UpdateServiceDto, @Req() req: any) {
    return this.serviceService.update(req.admin!.id,serviceId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAdminGuard)
  delete(@Param('id', ParseIntPipe) serviceId: number, @Req() req: any) {
    return this.serviceService.delete(req.admin!.id, serviceId);
  }
}
