import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import dayjs = require('dayjs');
import { DateRangeService } from './date-range.service';
import { MarkAppointmentDto } from './dto/mark-appointment.dto';
import { ConflictValidator } from './validators/conflict.validator';
import { WorkingHourValidator } from './validators/working-hours.validator';
import { TimeRangeValidator } from './validators/time-range.validator';
import { WorkingHourService } from './working-hour.service';

@Injectable()
export class AppointmentService {
  constructor(
      private prisma: PrismaService,
      private dateRangeService: DateRangeService,
      private conflict: ConflictValidator,
      private work: WorkingHourValidator,
      private timeRange: TimeRangeValidator,
      private workinHours: WorkingHourService
  ) {}

  async findAll(customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    return this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { appointmentStartAt: 'asc' },
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
    
    const requestStartAt = this.timeRange.validateDateFormat(dto.appointmentStartAt);

    this.timeRange.validateNotPast(requestStartAt);

    this.timeRange.validateSlotMinutes(requestStartAt, 15); // slot size

    const customerAppt = await this.prisma.appointment.findFirst({
      where: {
        customerId,
        status: { in: [Status.SCHEDULED] },
      },
    });
    
    if (customerAppt) throw new ConflictException('Zaten randevunuz var');

    const barber = await this.prisma.barber.findUnique({ where: { id: dto.barberId } });
    if (!barber) throw new NotFoundException('Berber bulunamadı');

    const allowedDates = await this.dateRangeService.getAvailableDates();
    const dateStr = dayjs(dto.appointmentStartAt).format('YYYY-MM-DD');

    if (!allowedDates.includes(dateStr)) {
      throw new ConflictException('Bu gün için randevu alınamaz (Tatil veya kapalı gün).');
    }

    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      select: { duration: true },
    });
    if (!service) throw new NotFoundException("Servis bulunamadı");

    const apptStartAt = dayjs(dto.appointmentStartAt);
    const apptEndAt = apptStartAt.add(service.duration, "minute");

    await this.work.workingValidate(dto, apptStartAt, apptEndAt);

    const hasConflict = await this.conflict.conflictValidate(dto, apptStartAt, apptEndAt);
    if (hasConflict == false) {
      throw new ConflictException('Randevu saatinde başka bir randevu var.');
    }

    try {
      return await this.prisma.appointment.create({
        data: { ...dto, customerId, appointmentStartAt: new Date(dto.appointmentStartAt), appointmentEndAt: apptEndAt.toDate() },
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
    const allowedHours = await this.dateRangeService.getAvailableHours(dto.barberId, dto.appointmentStartAt);
    const dateStr = dayjs(dto.appointmentStartAt).format('YYYY-MM-DD');
    const hourStr = dayjs(dto.appointmentStartAt).format('HH:mm');

    if (!allowedDates.includes(dateStr)) {
      throw new ConflictException('Bu gün için randevu alınamaz (Tatil veya kapalı gün).');
    }

    if (!allowedHours.includes(hourStr)) {
      throw new ConflictException('Bu saat için randevu alınamaz.');
    }
    try {
      return await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { ...dto, customerId, appointmentStartAt: new Date(dto.appointmentStartAt) },
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
    
    return this.workinHours.getDailyHours(barberId, date);
  }


  async findForBarber(barberId: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!barber) throw new NotFoundException('Berber bulunamadı');

    return await this.prisma.appointment.findMany({
      where: { barberId },
      orderBy: { appointmentStartAt: 'asc' },
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
      if (t.includes('barberId') && t.includes('appointmentStartAt')) {
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
