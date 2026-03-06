import { Injectable, NotFoundException } from '@nestjs/common';
import { RewardStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ShopService } from 'src/shop/shop.service';

@Injectable()
export class RewardService {

    constructor(
        private readonly prisma: PrismaService,
        private readonly shop: ShopService
    ) {}

    async getShopRewards(customerId: number, slug: string, status: RewardStatus) {
        const shop = await this.shop.checkShop(undefined, slug);
        const rewards = await this.prisma.reward.findMany({
            where: {
                customerId: customerId,
                shopId: shop.id,
                status: status
            },
            include: {
                campaign: true,
            }
        })
        return rewards
    }

    async getReward(customerId: number, slug: string, rewardId: number) {
        const reward = await this.prisma.reward.findFirst({
            where: {
                id: rewardId,
                customerId: customerId,
                shop: {
                    slug: slug
                }
            },
            include: {
                campaign: {
                    include: {
                        campaignServices: true
                    }
                }
            }
        })
        if (!reward) throw new NotFoundException('Ödül bulunamadı');

        return reward
    }

    async getAvailableReward(customerId: number, slug: string) {
        const reward = await this.prisma.reward.findFirst({
            where: {
                customerId: customerId,
                shop: {
                    slug: slug
                },
                status: RewardStatus.AVAILABLE
            },
            include: {
                campaign: {
                    include: {
                        campaignServices: true
                    }
                }
            }
        })
        if (!reward) throw new NotFoundException('Ödül bulunamadı');

        return reward
    }
}
