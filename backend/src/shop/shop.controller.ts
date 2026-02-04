import { Body, Controller, Get, Param, Post, Put, Req, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create.dto';
import { JwtUnifiedGuard } from 'src/auth/guards/jwt-unified.guard';
import { PlatformGuard } from './guards/jwt-platform-auth.guard';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as fs from 'fs';
import { UpdateShopDto } from './dto/update.dto';
import { UploadService } from 'src/upload/upload.service';
import { ActivityDto } from './dto/activity.dto';

@Controller('shop')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
    private readonly uploadService: UploadService
  ) {}
  
  @Post()
  @UseGuards(JwtUnifiedGuard, PlatformGuard)
  async create(@Body() dto: CreateShopDto) {
    return await this.shopService.create(dto);
  }

  @Get()
  async findAll() {
    return await this.shopService.findAll();
  }

  @Get('admin')
  @UseGuards(JwtAdminGuard)
  async findShopForAdmin(@Req() req: any) {
    return await this.shopService.findShopForAdmin(req.admin.sub);
  }

  @Put('admin/:id')
  @UseGuards(JwtAdminGuard)
  async update(@Param('id') id: number, @Body() dto: UpdateShopDto) {
    return await this.shopService.update(id, dto);
  }

  @Post('image')
  @UseGuards(JwtAdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    return await this.shopService.uploadImage(req.admin.sub, file);
  }

  @Put('image')
  @UseGuards(JwtAdminGuard)
  async deleteImage(@Req() req: any) {
    return await this.shopService.deleteImage(req.admin!.shopId);
  }

  @Put('activity/:id')
  @UseGuards(JwtUnifiedGuard, PlatformGuard)
  async activity(@Param('id') id: number, @Body() dto: ActivityDto ) {
    return await this.shopService.activity(id, dto);
  }
}
