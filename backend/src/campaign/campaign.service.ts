import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import dayjs = require('dayjs');
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { DiscountType } from '@prisma/client';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable() 
export class CampaignService {

  private tz = 'Europe/Istanbul';

  constructor(
    private readonly prisma: PrismaService
  ) {}
  
  async create(shopId: number, dto: CreateCampaignDto) { 
    await this.checkShop(shopId, undefined);
    await this.checkSimilarity(dto.name, shopId, dto.discountType, dto.discountValue);
 
    const startDate = dayjs(dto.startAt).startOf('day').toDate();
    const endDate = dayjs(dto.endAt).endOf('day').toDate();
    if (startDate > endDate) throw new ConflictException('Bitiş tarihi başlangıç tarihinden önce olmalıdır.');

    const services = await this.prisma.service.findMany({
      where: { id: { in: dto.serviceIds }, shopId },
      select: { id: true, name: true, price: true, duration: true },
    });

    if (!services.length) throw new NotFoundException("Hizmet bulunamadı");
    if (services.length !== dto.serviceIds.length) throw new NotFoundException("Bazı hizmetler yok");

    return await this.prisma.$transaction(async (tx)=> {
      const campaign = await tx.campaign.create({ 
        data: { 
          shopId,
          name: dto.name,
          description: dto.description,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          startAt: startDate,
          endAt: endDate ? endDate : null,
          wheelEnabled: dto.wheelEnabled,
          wheelWeight: dto.wheelWeight,
          active: dto.active
        } 
      });
      await tx.campaignService.createMany({
        data: services.map((s) => ({
          campaignId: campaign.id,
          serviceId: s.id
        }))
      });
      return campaign
    });
  }

  async findAll(slug: string) {
    const shop = await this.checkShop(undefined, slug);
    const now = dayjs().tz(this.tz).startOf('day').format('YYYY-MM-DDTHH:mm:ssZ');  

    const campaigns = await this.prisma.campaign.findMany({
      where: { 
        shopId: shop.id,
        startAt: { lte: now },
        OR: [
          { endAt: null },        
          { endAt: { gte: now } },
        ],
        wheelEnabled: true,
        active: true
      }
    })

    return campaigns
  }

  async findOne(id: number) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        campaignServices: {
          include: { service: true }
        }
      }
    });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');
    return campaign;
  }

  async update(id: number, shopId: number, dto: UpdateCampaignDto) {
    const existing = await this.prisma.campaign.findFirst({ where: { id, shopId } });
    if (!existing) throw new NotFoundException('Kampanya bulunamadı');

    const startDate = dto.startAt ? dayjs(dto.startAt).tz(this.tz).startOf('day').toDate() : existing.startAt;
    const endDate = dto.endAt ? dayjs(dto.endAt).tz(this.tz).endOf('day').toDate() : existing.endAt;

    if (startDate && endDate && startDate > endDate) throw new ConflictException('Bitiş tarihi geçersiz');

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.campaign.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          startAt: startDate,
          endAt: endDate,
          wheelEnabled: dto.wheelEnabled,
          wheelWeight: dto.wheelWeight,
          active: dto.active
        }
      });

      if (dto.serviceIds) {
        await tx.campaignService.deleteMany({ where: { campaignId: id } });
        const validServices = await tx.service.findMany({
          where: { id: { in: dto.serviceIds }, shopId }
        });
        if (validServices.length !== dto.serviceIds.length) throw new NotFoundException("Hizmet listesi geçersiz");
        
        await tx.campaignService.createMany({
          data: dto.serviceIds.map(sId => ({ campaignId: id, serviceId: sId }))
        });
      }
      return updated;
    });
  }

  async remove(id: number, shopId: number) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id, shopId } });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı');

    await this.prisma.$transaction([
      this.prisma.campaignService.deleteMany({ where: { campaignId: id } }),
      this.prisma.campaign.delete({ where: { id } }),
    ]);
    return { success: true };
  }

  private async checkSimilarity(
    name: string, 
    shopId: number, 
    discountType: DiscountType, 
    discountValue: string
  ): Promise<void> {
    const check = await this.prisma.campaign.findFirst({
      where: { name, shopId, discountType, discountValue, active: true, wheelEnabled: true }
    })

    if(check) {
      throw new ConflictException('Bu kampanya daha önce oluşturulmuş');
    }
  }

  private async checkShop(shopId?: number, slug?: string) {
    const shop = shopId ? 
      await this.prisma.shop.findUnique({ where: { id: shopId } }) : 
      await this.prisma.shop.findFirst({ where: { slug } });

    if (!shop) throw new NotFoundException('İşletme bulunamadı');
    if (!shop.active) throw new ConflictException('İşletme aktif değil');

    return shop
  }
}
