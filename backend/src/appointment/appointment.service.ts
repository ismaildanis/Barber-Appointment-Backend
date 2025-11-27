import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import dayjs = require('dayjs');
import { DateRangeService } from './date-range.service';
import { MarkAppointmentDto } from './dto/mark-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
      private prisma: PrismaService,
      private dateRangeService: DateRangeService,
  ) {}

  async findAll(customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    return this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { appointmentAt: 'asc' },
    });
  }

  async findOne(appointmentId: number, customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');
    return appt;
  }

  async create(dto: any, customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    
    const customerAppt = await this.prisma.appointment.findFirst({
      where: {
        customerId,
        status: { in: [Status.SCHEDULED] },
      },
    });

    console.log(customerAppt);
    
    if (customerAppt) throw new ConflictException('Zaten randevunuz var');

    const barber = await this.prisma.barber.findUnique({ where: { id: dto.barberId } });
    if (!barber) throw new NotFoundException('Berber bulunamadı');
    const allowedDates = await this.dateRangeService.getAvailableDates();
    const allowedHours = await this.dateRangeService.getAvailableHours(dto.barberId, dto.appointmentAt);
    const dateStr = dayjs(dto.appointmentAt).format('YYYY-MM-DD');
    const hourStr = dayjs(dto.appointmentAt).format('HH:mm');

    if (!allowedDates.includes(dateStr)) {
      throw new ConflictException('Bu gün için randevu alınamaz (Tatil veya kapalı gün).');
    }

    if (!allowedHours.includes(hourStr)) {
      throw new ConflictException('Bu saat için randevu alınamaz.');
    }
    try {
      return await this.prisma.appointment.create({
        data: { ...dto, customerId, appointmentAt: new Date(dto.appointmentAt) },
      });
    } catch (e) {
      this.handleUniqueError(e);
    }
  }

  async update(dto: any, customerId: number, appointmentId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');
    const allowedDates = await this.dateRangeService.getAvailableDates();
    const allowedHours = await this.dateRangeService.getAvailableHours(dto.barberId, dto.appointmentAt);
    const dateStr = dayjs(dto.appointmentAt).format('YYYY-MM-DD');
    const hourStr = dayjs(dto.appointmentAt).format('HH:mm');

    if (!allowedDates.includes(dateStr)) {
      throw new ConflictException('Bu gün için randevu alınamaz (Tatil veya kapalı gün).');
    }

    if (!allowedHours.includes(hourStr)) {
      throw new ConflictException('Bu saat için randevu alınamaz.');
    }
    try {
      return await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { ...dto, customerId, appointmentAt: new Date(dto.appointmentAt) },
      });
    } catch (e) {
      this.handleUniqueError(e);
    }
  }

  async delete(customerId: number, appointmentId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');

    await this.prisma.appointment.delete({ where: { id: appointmentId } });
    return { message: 'Randevu silindi' };
  }

  async getAvailableDates(customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    return this.dateRangeService.getAvailableDates();
  }

  async getAvailableHours(customerId: number, barberId: number, date: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    
    return this.dateRangeService.getAvailableHours(barberId, date);
  }


  async findForBarber(barberId: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) throw new NotFoundException('Berber bulunamadı');

    return await this.prisma.appointment.findMany({
      where: { barberId },
      orderBy: { appointmentAt: 'asc' },
    });
  }

  async markAppointment(adminId: number, appointmentId: number, dto: MarkAppointmentDto) {
    const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })
    if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}

    const markAppointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });

    if (!markAppointment) throw new NotFoundException('Randevu bulunamadı');
    try {
      await this.prisma.appointment.update({where: {id: appointmentId}, data: {status: dto.status}})
      let stat
      switch (dto.status) {
        case 'COMPLETED':
          stat = 'Randevu onaylandı olarak işaretlendi'
          break;
        case 'CANCELLED':
          stat = 'Randevu iptal edildi olarak işaretlendi'
          break;
        case 'NO_SHOW':
          stat = 'Randevuya gelinmedi olarak işaretlendi'
          break
        default:
          break;
      }
      return {message: `${stat}`}
    } catch (error) {
      throw new Error(error)
    }
  }

  
  private handleUniqueError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const t = String(e.meta?.target ?? '');
      if (t.includes('barberId') && t.includes('appointmentAt')) {
        throw new ConflictException('Bu saat için berber zaten dolu');
      }
      if (t.includes('customerId')) {
        throw new ConflictException('Zaten bir randevunuz var');
      }
      throw new ConflictException('Tekrarlanan kayıt');
    }
    throw e;
  }

}
