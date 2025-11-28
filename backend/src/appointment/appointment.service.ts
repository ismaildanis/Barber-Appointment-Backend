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
import { BarberCancelDto } from './dto/barber-cancel.dto';
import { CANCELLED } from 'dns';
import { BreakDto } from './dto/break.dto';

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
    if (!barber.active) {
      throw new ConflictException('Bu berber şu anda aktif değildir ve randevu alamaz.');
    }
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
    
    const allHours = await this.workinHours.getDailyHours(barberId, date);
    const busyHours = await this.workinHours.getBusyHours(barberId, date);
    return {
      allHours,
      busyHours,
    }
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

  async markCancel(adminId: number, appointmentId: number, dto: MarkAppointmentDto) {
    const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })
    if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}
    
    const markAppointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    
    if (!markAppointment) throw new NotFoundException('Randevu bulunamadı');
    try {
      await this.prisma.appointment.update({where: {id: appointmentId}, data: {cancelReason: dto.cancelReason, status: "CANCELLED", cancelledAt: new Date() }})
      return {message: "Randevu iptal edildi olarak işaretlendi"}
    } catch (error) {
      throw new Error(error)
    }
  }
  async markCompleted(adminId: number, appointmentId: number) {
    const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })
    if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}

    const markAppointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });

    if (!markAppointment) throw new NotFoundException('Randevu bulunamadı');
    try {
      await this.prisma.appointment.update({where: {id: appointmentId}, data: {status: "COMPLETED"}})
      return {message: "Randevu onaylandı olarak işaretlendi"}
    } catch (error) {
      throw new Error(error)
    }
  }

  async markNoShow(adminId: number, appointmentId: number) {
    const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })
    if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}
  
    const markAppointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
  
    if (!markAppointment) throw new NotFoundException('Randevu bulunamadı');
    try {
      await this.prisma.appointment.update({where: {id: appointmentId}, data: {status: "NO_SHOW"}})
      return {message: "Randevuya gelinmedi olarak işaretlendi"}
    } catch (error) {
      throw new Error(error)
    }
  }
  
  async cancelByBarber(barberId: number, appointmentId: number, dto: BarberCancelDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber) throw new UnauthorizedException('Berber bulunamadı');
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barberId },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');
    await this.prisma.appointment.update({ where: { id: appointmentId }, data: { status: dto.status, cancelReason: dto.cancelReason, cancelledAt: new Date() } });
    return { message: 'Randevu iptal edildi' };
  }

  async addBreak(barberId: number, dto: BreakDto) {
    // 1) Berber var mı?
    const barber = await this.prisma.barber.findUnique({ where: { id: barberId }});
    if (!barber) throw new NotFoundException("Berber bulunamadı");

    // 2) Bugünün çalışma planını bul
    const day = dayjs().tz("Europe/Istanbul");
    const work = await this.prisma.workingHour.findFirst({
      where: { barberId, dayOfWeek: day.day() }
    });

    if (!work) throw new NotFoundException("Bugün çalışma saati tanımlı değil");

    // 3) BreakPeriod ekle
    const breakPeriod = await this.prisma.breakPeriod.create({
      data: {
        workingHourId: work.id,
        startMin: dto.startMin,
        endMin: dto.endMin,
      }
    });

    // 4) Bu aralığa denk gelen randevuları iptal et
    const start = day.startOf("day").add(dto.startMin, "minute").toDate();
    const end   = day.startOf("day").add(dto.endMin, "minute").toDate();

    await this.prisma.appointment.updateMany({
      where: {
        barberId,
        status: Status.SCHEDULED,
        appointmentStartAt: { lt: end },
        appointmentEndAt: { gt: start }
      },
      data: {
        status: Status.BARBER_CANCELLED,
        cancelReason: "Berber mola verdi",
        cancelledAt: new Date()
      }
    });

    return { message: "Mola eklendi ve çakışan randevular iptal edildi.", breakPeriod };
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
