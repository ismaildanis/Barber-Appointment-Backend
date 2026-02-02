import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Multer } from 'multer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Service } from '@prisma/client';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}
  async create(adminId: number, dto: CreateServiceDto) {
    const admin = await this.prisma.admin.findUnique({where: {id: adminId}, include: {shop: true}})
    if(!admin) throw new UnauthorizedException('Admin bulunamadı')
    if(!admin.shop.active) throw new ConflictException('İşletme aktif değil')

    try {
      await this.prisma.service.create({
        data: {
          ...dto, 
          shopId: admin.shopId
        }  
      })
      return {message: 'Hizmet başarıyla oluşturuldu'}
    } catch (error) {
      throw new Error(error)
    }
  }

  async findAllForAdmin(shopId: number) {
    const shop = await this.prisma.shop.findFirst({where: {id: shopId}})
    if(!shop) throw new NotFoundException('İşletme bulunamadı')
    if(!shop.active) throw new ConflictException('İşletme aktif değil')
    const baseUrl = this.config.get<string>('APP_BASE_URL');
    const services = await this.prisma.service.findMany({where: {shopId: shopId, deletedAt: null}})
    if(services.length == 0) throw new NotFoundException('Hizmetler bulunamadı')

    return services.map(b => ({
        ...b,
        image: b.image ? `${baseUrl}/${b.image}` : `${baseUrl}/${"uploads/services/default-service.png"}`
    }));
  }

  async findAll(slug: string) {
    const shop = await this.prisma.shop.findFirst({where: {slug: slug}})
    if(!shop) throw new NotFoundException('İşletme bulunamadı')
    if(!shop.active) throw new ConflictException('İşletme aktif değil')
    const baseUrl = this.config.get<string>('APP_BASE_URL');
    const services = await this.prisma.service.findMany({where: {shopId: shop.id, deletedAt: null}})
    if(services.length == 0) throw new NotFoundException('Hizmetler bulunamadı')

    return services.map(b => ({
        ...b,
        image: b.image ? `${baseUrl}/${b.image}` : `${baseUrl}/${"uploads/services/default-service.png"}`
    }));
  }

  async findOne(adminId: number, serviceId: number) {
    const baseUrl = this.config.get<string>('APP_BASE_URL');
    const admin = await this.prisma.admin.findUnique({where: {id: adminId }})
    if(!admin) throw new UnauthorizedException('Admin bulunamadı')

    const service = await this.prisma.service.findUnique({where: {id: serviceId, shopId: admin.shopId, deletedAt: null}})
    if(!service) throw new NotFoundException('Hizmet bulunamadı')
    return {
      ...service,
      image: service.image ? `${baseUrl}/${service.image}` : `${baseUrl}/${"uploads/services/default-service.png"}`
    }
  }

  async update(adminId: number, serviceId: number, updateServiceDto: UpdateServiceDto) {
    const admin = await this.prisma.admin.findUnique({where: {id: adminId}, include: {shop: {select: {active: true}}}})
    if(!admin) throw new UnauthorizedException('Admin bulunamadı')
    if(!admin.shop.active) throw new ConflictException('İşletme aktif değil')

    const service = await this.prisma.service.findUnique({where: {id: serviceId, shopId: admin.shopId, deletedAt: null}})
    if(!service) throw new NotFoundException('Hizmet bulunamadı')
    
    try {
      const result = await this.prisma.service.update({where: {id: serviceId}, data: updateServiceDto})
      return {message: 'Hizmet başarıyla güncellendi', data: result}
    } catch (error) {
      throw new Error(error)
    }
      
  }

  async uploadImage(shopId: number, serviceId: number, imageUrl: string) {
    const isImageExists = await this.prisma.service.findFirst({
        where: { id: serviceId, shopId: shopId },
        select: { image: true }
    });

    if (!isImageExists) {
        throw new NotFoundException("Hizmet bulunamadı");
    }

    if (isImageExists.image != null) {
        throw new ConflictException("Zaten bir resim bulunmakta");
    }

    await this.prisma.service.update({
        where: { id: serviceId },
        data: { image: imageUrl }
    });

    return { message: "Resim başarıyla yüklendi" };
  }

  async deleteImage(shopId: number, serviceId: number) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, shopId, image: { not: null } },
      select: { image: true },
    });

    if (!service) {
      throw new NotFoundException('Hizmet bulunamadı veya resim yok');
    }

    const updated = await this.prisma.service.updateMany({
      where: {
        id: serviceId,
        shopId,
        image: { not: null },
      },
      data: { image: null },
    });

    if (updated.count === 0) {
      throw new ConflictException('Resim zaten silinmiş');
    }

    if (service.image) {
      this.deleteFile(service.image);
    }

    return { message: 'Resim başarıyla silindi' };
  }

  async delete(shopId: number, serviceId: number) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, shopId, deletedAt: null },
      select: { image: true },
    });

    if (!service) {
      throw new NotFoundException('Hizmet bulunamadı');
    }

    const updated = await this.prisma.service.updateMany({
      where: { id: serviceId, shopId, deletedAt: null },
      data: { deletedAt: new Date(), image: null },
    });

    if (updated.count === 0) {
      throw new ConflictException('Hizmet zaten silinmiş');
    }

    if (service.image) {
      this.deleteFile(service.image);
    }

    return { message: 'Hizmet silindi' };
  }

  private deleteFile(serviceImage: string) {
    if (serviceImage && !serviceImage.includes('default-service.png')) {
        const filePath = path.resolve(process.cwd(), serviceImage);
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                console.warn('Dosya silinemedi:', e);
            }
        }
    }
  }
}
