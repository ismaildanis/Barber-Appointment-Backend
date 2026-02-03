import { Module } from '@nestjs/common';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { PlatformGuard } from './guards/jwt-platform-auth.guard';
import { JwtUnifiedGuard } from 'src/auth/guards/jwt-unified.guard';
import { UploadModule } from 'src/upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [ShopController],
  providers: [ShopService, PlatformGuard, JwtUnifiedGuard],
})
export class ShopModule {}
