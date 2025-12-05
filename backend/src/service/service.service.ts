import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Multer } from 'multer';

@Injectable()
export class ServiceService {

  constructor(private prisma: PrismaService) {}
  async create(adminId: number, dto: CreateServiceDto) {
    const admin = await this.prisma.admin.findUnique({where: {id: adminId}})
    if(!admin) throw new UnauthorizedException('Admin bulunamadı')
    try {
      await this.prisma.service.create({data: dto})
      return {message: 'Hizmet başarıyla oluşturuldu'}
    } catch (error) {
      throw new Error(error)
    }
  }

  async findAll() {

    const services = await this.prisma.service.findMany()
    if(!services) throw new NotFoundException('Hizmetler bulunamadı')
    return services
  }

  async findOne(adminId: number, serviceId: number) {
    const admin = await this.prisma.admin.findUnique({where: {id: adminId}})
    if(!admin) throw new UnauthorizedException('Admin bulunamadı')

    const service = await this.prisma.service.findUnique({where: {id: serviceId}})
    if(!service) throw new NotFoundException('Hizmet bulunamadı')
    return service
  }

  async update(adminId: number, serviceId: number, updateServiceDto: UpdateServiceDto) {
    const admin = await this.prisma.admin.findUnique({where: {id: adminId}})
    if(!admin) throw new UnauthorizedException('Admin bulunamadı')

    const service = await this.prisma.service.findUnique({where: {id: serviceId}})
    if(!service) throw new NotFoundException('Hizmet bulunamadı')
    
    try {
      const result = await this.prisma.service.update({where: {id: serviceId}, data: updateServiceDto})
      return {message: 'Hizmet başarıyla güncellendi', data: result}
    } catch (error) {
      throw new Error(error)
    }
      
  }

  async uploadImage(adminId: number, serviceId: number, imageUrl: string) {
    const admin = await this.prisma.admin.findUnique({
        where: { id: adminId }
    });

    if (!admin) {
        throw new UnauthorizedException("Admin bulunamadı");
    }

    await this.prisma.service.update({
        where: { id: serviceId },
        data: { image: imageUrl }
    });

    return { message: "Resim başarıyla yüklendi" };
  }

  async deleteImage(adminId: number, serviceId: number) {
    const admin = await this.prisma.admin.findUnique({
        where: { id: adminId }
    });

    if (!admin) {
        throw new UnauthorizedException("Admin bulunamadı");
    }

    await this.prisma.service.update({
        where: { id: serviceId },
        data: { image: null }
    });

    return { message: "Resim başarıyla silindi" };
  }

  async delete(adminId: number, serviceId: number) {
    const admin = await this.prisma.admin.findUnique({where: {id: adminId}})
    if(!admin) throw new UnauthorizedException('Admin bulunamadı')

    const service = this.prisma.service.findUnique({where: {id: serviceId}})
    if(!service) throw new NotFoundException('Hizmet bulunamadı')
    this.prisma.service.delete({where: {id: serviceId}})
    return {message: 'Hizmet başarıyla silindi'} 
  }
}
