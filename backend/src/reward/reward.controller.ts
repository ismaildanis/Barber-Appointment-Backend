import { Controller, Get, UseGuards, Param, Post, Query, Req } from '@nestjs/common';
import { RewardService } from './reward.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RewardStatus } from '@prisma/client';

@Controller('reward')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Get(':slug')
  @UseGuards(JwtAuthGuard)
  async getShopRewards(@Param('slug') slug: string, @Req() req: any, @Query('status') status: RewardStatus) {
    return await this.rewardService.getShopRewards(req.customer.sub, slug, status);
  }

  @Get('available/:slug')
  @UseGuards(JwtAuthGuard)
  async getAvailableReward(@Param('slug') slug: string, @Req() req: any) {
    return await this.rewardService.getAvailableReward(req.customer.sub, slug);
  }
  
  @Get(':slug/:id')
  @UseGuards(JwtAuthGuard)
  async getReward(@Param('slug') slug: string, @Param('id') id: number, @Req() req: any) {
    return await this.rewardService.getReward(req.customer.sub, slug, id);
  }


}
