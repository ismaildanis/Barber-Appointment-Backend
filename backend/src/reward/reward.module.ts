import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { RewardController } from './reward.controller';
import { ShopModule } from 'src/shop/shop.module';
import { ExpiredRewardsCron } from './cron/expired-rewards.cron';

@Module({
  imports: [ShopModule],
  controllers: [RewardController],
  providers: [
    RewardService,
    ExpiredRewardsCron
  ],
  exports: [RewardService],
})
export class RewardModule {}
