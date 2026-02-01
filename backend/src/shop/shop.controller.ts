import { Body, Controller, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ShopService } from './shop.service';
import { CreateShopDto } from './dto/create.dto';
import { JwtUnifiedGuard } from 'src/auth/guards/jwt-unified.guard';
import { PlatformGuard } from './guards/jwt-platform-auth.guard';

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
}
