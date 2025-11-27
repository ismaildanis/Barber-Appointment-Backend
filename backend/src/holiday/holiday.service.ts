import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Injectable()
export class HolidayService {
  constructor(private prisma: PrismaService) {}

  async create(adminId: number, dto: CreateHolidayDto) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin bulunamadı');

    const exists = await this.prisma.holidayDate.findUnique({
      where: { date: new Date(dto.date) }
    });

    if (exists) {
      throw new ConflictException('Bu gün zaten tatil ilan edilmiş.');
    }

    return await this.prisma.holidayDate.create({
      data: {
        date: new Date(dto.date),
        reason: dto.reason
      }
    });
  }

  async findAll(adminId: number) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin bulunamadı');
    return this.prisma.holidayDate.findMany({ orderBy: { date: 'asc' } });
  }

  async remove(adminId: number, id: number) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin bulunamadı');
    await this.prisma.holidayDate.delete({ where: { id } });
    return { message: 'Tatil ilanı başarıyla silindi' };
  }
}
