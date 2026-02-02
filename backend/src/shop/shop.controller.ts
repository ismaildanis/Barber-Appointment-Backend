import { Body, Controller, Get, Param, Post, Put, Req, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create.dto';
import { JwtUnifiedGuard } from 'src/auth/guards/jwt-unified.guard';
import { PlatformGuard } from './guards/jwt-platform-auth.guard';
import { JwtAdminGuard } from 'src/admin-auth/guards/jwt-admin-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as fs from 'fs';

@Controller('shop')
export class ShopController {
  constructor(
    private readonly shopService: ShopService,
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

  @Post('image')
  @UseGuards(JwtAdminGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadImage(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const fileName = `${req.user.sub}-${Date.now()}.jpg`;
    const folder = `uploads/shops`;
    const filePath = `${folder}/${fileName}`;

    fs.mkdirSync(folder, { recursive: true });
    fs.writeFileSync(filePath, file.buffer);
    return await this.shopService.uploadImage(req.user.sub, filePath);
  }

  @Put('image')
  @UseGuards(JwtAdminGuard)
  async deleteImage(@Req() req: any) {
    return await this.shopService.deleteImage(req.admin.shopId);
  }

  @Put('activity/:id')
  @UseGuards(JwtUnifiedGuard, PlatformGuard)
  async activity(@Param('id') id: number, @Body() activity: boolean ) {
    return await this.shopService.activity(id, activity);
  }
}
