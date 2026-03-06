import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { CampaignModule } from 'src/campaign/campaign.module';
import { ShopModule } from 'src/shop/shop.module';

@Module({
  imports: [CampaignModule, ShopModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
