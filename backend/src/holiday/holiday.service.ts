import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import dayjs = require('dayjs');
import { PushService } from 'src/appointment/push-notifications.service';
@Injectable()
export class HolidayService {
  constructor(
    private prisma: PrismaService,       
    private push: PushService
  ) {}

  async create(adminId: number, dto: CreateHolidayDto) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin bulunamadı');

    const dateOnly = new Date(dto.date);
    const exists = await this.prisma.holidayDate.findUnique({
      where: { date: dateOnly }
    });

    if (exists) {
      throw new ConflictException('Bu gün zaten tatil ilan edilmiş.');
    }
    try {
      const result = await this.prisma.holidayDate.create({
        data: {
          date: dateOnly,
          reason: dto.reason
        }
      });
      const startDay = dayjs(result.date).startOf('day').toDate();
      const endDay = dayjs(result.date).endOf('day').toDate(); 
      const dateStr = dateOnly.toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });
      const res = await this.prisma.appointment.findMany({
        where: {
          appointmentStartAt: {gte: startDay, lte: endDay},
          status: 'SCHEDULED'
        },
      });

      await this.prisma.appointment.updateMany({
        where: {id: {in: res.map((r) => r.id)}},
        data: {status: 'CANCELLED'}
      })

      for (const appt of res){
        await this.push.notify(
          appt.customerId,
          'customer',
          'Randevunuz iptal edildi',
          `Randevunuz ${dateStr} tarihi tatil günü ilan edilmesi nedeniyle iptal edildi`,
        )
      }

      return result
    } catch (error) {
      throw new Error(error);
    }
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
