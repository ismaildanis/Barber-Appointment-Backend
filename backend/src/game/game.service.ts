import { ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShopService } from 'src/shop/shop.service';
import { Campaign, GameType, Prisma } from '@prisma/client';
import { CampaignService } from 'src/campaign/campaign.service';
import { randomInt } from 'crypto';

import dayjs = require('dayjs');
import isoWeek from 'dayjs/plugin/isoWeek';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

@Injectable()
export class GameService {
  private readonly tz = 'Europe/Istanbul';

  constructor(
    private readonly prisma: PrismaService,
    private readonly shop: ShopService,
    private readonly campaign: CampaignService,
  ) {}

  async spinWheel(customerId: number, slug: string) {
    const shop = await this.shop.checkShop(undefined, slug);
    const now = dayjs().tz(this.tz);

    await this.checkSpinConflict(customerId, shop.id);

    const campaigns = await this.campaign.findAll(slug);
    const rewardCampaign = await this.rewardCalculation(campaigns, customerId, shop.id, now);

    if (!rewardCampaign) {
      throw new ConflictException('Kampanya bulunamadı, Daha sonra tekrar deneyiniz.');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.gameSession.create({
          data: {
            customerId: customerId,
            campaignId: rewardCampaign.id,
            gameType: GameType.SPIN_WHEEL,
            shopId: shop.id,
            playedAt: now.toDate(),
            nextPlayAt: now.add(1, 'minute').toDate(),
          },
        });

        await tx.reward.create({
          data: {
            customerId: customerId,
            shopId: shop.id,
            campaignId: rewardCampaign.id,
            status: 'AVAILABLE',
            expiresAt: now.add(1, 'week').endOf('day').toDate(),
          },
        });
      });

      return rewardCampaign;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        console.log(error);
        throw new ConflictException('Bu hafta zaten çark çevirdiniz.');
      }
      throw new InternalServerErrorException('Çark işlemi tamamlanamadı.');
    }
  }

  async getLastSpin(customerId: number, slug: string) {
    const shop = await this.shop.checkShop(undefined, slug);
    const now = dayjs().tz(this.tz);

    const gameSession = await this.prisma.gameSession.findFirst({
      where: {
        customerId: customerId,
        gameType: GameType.SPIN_WHEEL,
        shopId: shop.id,
        playedAt: { lte: now.toDate() },
      },
      orderBy: { playedAt: 'desc' }
    });

    if (!gameSession) return null;

    return gameSession;
  }

  private async rewardCalculation(campaigns: Campaign[], customerId: number, shopId: number, now: dayjs.Dayjs) {
    const totalWeight = campaigns.reduce((total, campaign) => total + campaign.wheelWeight, 0);
    if (totalWeight <= 0) throw new ConflictException('Uygun kampanya yok.');

    let r = randomInt(1, totalWeight + 1);

    for (const campaign of campaigns) {
      r -= campaign.wheelWeight;
      if (r <= 0) return campaign;
    }
  }

  private async checkSpinConflict(customerId: number, shopId: number) {
    const now = dayjs()

    const activeReward = await this.prisma.reward.findFirst({
      where: {
        customerId: customerId,
        shopId: shopId, 
        status: 'AVAILABLE',
        expiresAt: { gt: now.toDate() },
      }, 
    });

    if (activeReward) {
      throw new ConflictException('Zaten bir ödülünüz var, ödülünüzü kullandıktan sonra tekrar deneyiniz.');
    }

    const last = await this.prisma.gameSession.findFirst({
      where: { customerId, shopId, gameType: GameType.SPIN_WHEEL },
      orderBy: { playedAt: 'desc' }, 
    });

    if (!last) return;

    const nextSpinStartAt = last.nextPlayAt

    if (now.isBefore(nextSpinStartAt)) {
      throw new ConflictException('Sadece Haftada bir kere çevirebilirsiniz!');
    }

    return last;
  }
}
