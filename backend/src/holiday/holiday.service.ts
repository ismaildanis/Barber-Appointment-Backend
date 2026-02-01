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

  async create(shopId: number, dto: CreateHolidayDto) {
    const dateOnly = dayjs(dto.date).startOf('day').toDate();

    const exists = await this.prisma.holidayDate.findFirst({
      where: { shopId, date: dateOnly },
    });

    if (exists) {
      throw new ConflictException('Bu gün zaten tatil ilan edilmiş.');
    }

    const { holiday, appointments } = await this.prisma.$transaction(async (tx) => {
      const holiday = await tx.holidayDate.create({
        data: { shopId, date: dateOnly, reason: dto.reason },
      });

      const startDay = dayjs(dateOnly).startOf('day').toDate();
      const endDay = dayjs(dateOnly).endOf('day').toDate();

      const appointments = await tx.appointment.findMany({
        where: {
          shopId,
          appointmentStartAt: { gte: startDay, lte: endDay },
          status: 'SCHEDULED',
        },
      });

      await tx.appointment.updateMany({
        where: { id: { in: appointments.map(a => a.id) } },
        data: { status: 'CANCELLED' },
      });

      return { holiday, appointments };
    });

    const dateStr = dayjs(dateOnly).locale('tr').format('DD MMMM dddd');

    for (const appt of appointments){
      if (appt.customerId) {
        await this.push.notify(
          appt.customerId,
          'customer',
          'Randevunuz iptal edildi',
          `Randevunuz ${dateStr} tarihi tatil günü ilan edildi`,
        )
      }
    }
    return holiday
  }

  async findAll(adminId: number) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin bulunamadı');
    return this.prisma.holidayDate.findMany({ where: { shopId: admin.shopId }, orderBy: { date: 'desc' } });
  }

  async remove(adminId: number, id: number) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin bulunamadı');
    await this.prisma.holidayDate.delete({ where: { shopId: admin.shopId, id: id } });
    return { message: 'Tatil ilanı başarıyla silindi' };
  }
}
