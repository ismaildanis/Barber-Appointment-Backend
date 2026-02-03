import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class ServiceService {
  constructor(
    private prisma: PrismaService, 
    private config: ConfigService,
    private uploadService: UploadService
  ) {}
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

  async findAllForAdmin(adminId: number) {
    const admin = await this.prisma.admin.findFirst({where: {id: adminId}})
    if(!admin) throw new NotFoundException('Admin bulunamadı')
    const baseUrl = this.config.get<string>('APP_BASE_URL');
    const services = await this.prisma.service.findMany({where: {shopId: admin.shopId, deletedAt: null}})
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
    if(!service) {
      throw new NotFoundException('Hizmet bulunamadı')
    }
    
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

    if (isImageExists.image) {
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
      where: { id: serviceId, shopId },
      select: { image: true },
    });

    if (!service) {
      throw new NotFoundException("Hizmet bulunamadı");
    }

    if (!service.image) {
      throw new NotFoundException("Hizmetin zaten resmi yok");
    }

    await this.uploadService.delete(service.image);

    await this.prisma.service.update({
      where: { id: serviceId },
      data: { image: null },
    });

    return { message: "Resim başarıyla silindi" };
  }


  async delete(shopId: number, serviceId: number) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, shopId, deletedAt: null },
      select: { id: true, image: true },
    });

    if (!service) {
      throw new NotFoundException('Hizmet bulunamadı');
    }

    await this.prisma.$transaction(async (tx) => {
      if (service.image) {
        await this.uploadService.delete(service.image);
      }

      await tx.service.update({
        where: { id: serviceId },
        data: {
          deletedAt: new Date(),
          image: null,
        },
      });
    });

    return { message: 'Hizmet silindi' };
  }
}
