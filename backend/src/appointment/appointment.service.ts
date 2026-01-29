import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Status } from '@prisma/client';
import { DateRangeService } from './date-range.service';
import { MarkAppointmentDto } from './dto/mark-appointment.dto';
import { ConflictValidator } from './validators/conflict.validator';
import { WorkingHourValidator } from './validators/working-hours.validator';
import { TimeRangeValidator } from './validators/time-range.validator';
import { WorkingHourService } from './working-hour.service';
import { BarberCancelDto } from './dto/barber-cancel.dto';
import { BreakDto } from './dto/break.dto';
import { PushService } from './push-notifications.service';
import { AppointmentRange } from './enum/appointment-range.enum';
import { Expo } from 'expo-server-sdk';
const expo = new Expo();
import dayjs = require('dayjs');
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class AppointmentService {

  constructor(
      private prisma: PrismaService,
      private dateRangeService: DateRangeService,
      private conflict: ConflictValidator,
      private work: WorkingHourValidator,
      private timeRange: TimeRangeValidator,
      private workinHours: WorkingHourService,
      private push: PushService
  ) {}


  async indexAdmin(adminId: number, status: Status, date: string) {
      const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
      if (!admin) throw new UnauthorizedException('Admin bulunamadı');
      
      const startOfDay = dayjs(date).startOf('day').toDate();
      const endOfDay = dayjs(date).endOf('day').toDate();
      
      const appts = await this.prisma.appointment.findMany({ 
        where: { 
          status, 
          appointmentStartAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        orderBy: { createdAt: 'desc' },  
        include: { 
          barber: {
            select: { id: true, firstName: true, lastName: true },
          },
          appointmentServices: {
            include: {
              service: {
                select: { id: true, name: true, price: true, duration: true },
              }
            }
          },
          customer: {
            select: { id: true, firstName: true, lastName: true, phone: true, email: true }
          }
        }
      });

      return appts;
  }
  async findOneAdmin(appointmentId: number, adminId: number) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin bulunamadı');
    const appt = await this.prisma.appointment.findUnique({ 
      where: { id: appointmentId },
      include: { 
        barber: {
          select: { id: true, firstName: true, lastName: true },
        },
        appointmentServices: {
          include: {
            service: {
              select: { id: true, name: true, price: true, duration: true },
            }
          }
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true }
        } 
      }
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');
    return appt;
  }
  async findAll(customerId: number, range: AppointmentRange) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

    let dateFilter: any = {}
    
    switch(range) {
      case AppointmentRange.TODAY:
        dateFilter = { gte: dayjs().startOf('day').toDate(), lte : dayjs().endOf('day').toDate() };
        break;

      case AppointmentRange.LAST_7_DAYS:
        dateFilter = { gte: dayjs().subtract(7, 'day').startOf('day').toDate() };
        break;

      case AppointmentRange.LAST_1_MONTH:
        dateFilter = { gte: dayjs().subtract(1, 'month').startOf('day').toDate() };
        break;

      case AppointmentRange.LAST_3_MONTHS:
        dateFilter = { gte: dayjs().subtract(3, 'month').startOf('day').toDate() };
        break;

      case AppointmentRange.LAST_1_YEAR:
        dateFilter = { gte: dayjs().subtract(1, 'year').startOf('day').toDate() };
        break;

      case AppointmentRange.LAST_3_YEARS:
        dateFilter = { gte: dayjs().subtract(3, 'year').startOf('day').toDate() };
        break;

      case AppointmentRange.LAST_5_YEARS:
        dateFilter = { gte: dayjs().subtract(5, 'year').startOf('day').toDate() };
        break;

      case AppointmentRange.LAST_10_YEARS:
        dateFilter = { gte: dayjs().subtract(10, 'year').startOf('day').toDate() };
        break;

      case AppointmentRange.PLUS_10_YEARS: {
        const tenYearsAgo = dayjs()
          .subtract(10, 'year')
          .startOf('day')
          .toDate();

        dateFilter = {
          lte: tenYearsAgo,
        };
        break;
      }
      default:
        throw new BadRequestException('Geçersiz tarih aralığı');
    }

    return this.prisma.appointment.findMany({
      where: { 
        customerId,
        ...(Object.keys(dateFilter).length && {
          appointmentStartAt: dateFilter
        })
      },
      orderBy: { createdAt: 'desc' },
      include: {
        barber: {
          select: { id: true, firstName: true, lastName: true },
        },
        appointmentServices: {
          include: {
            service: {
              select: { id: true, name: true },
            }
          }
        }
      }
    });
  }

  async findOne(appointmentId: number, customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
      include: {
        barber: {
          select: { id: true, firstName: true, lastName: true },
        },
        appointmentServices: {
          include: {
            service: {
              select: { id: true, name: true },
            }
          }
        }
      }
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');
    return appt;
  }

  async lastCompleted(customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const appt = await this.prisma.appointment.findFirst({
      where: { customerId, status: Status.COMPLETED },
      orderBy: { createdAt: 'desc' },
      include: {
        barber: {
          select: { id: true, firstName: true, lastName: true },
        },
        appointmentServices: {
          include: {
            service: {
              select: { id: true, name: true },
            }
          }
        }
      },
    });
    return appt ?? null;
  }

  async lastScheduled(customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const appt = await this.prisma.appointment.findFirst({
      where: { customerId, status: Status.SCHEDULED },
      orderBy: { createdAt: 'desc' },
       include: {
        barber: {
          select: { id: true, firstName: true, lastName: true },
        },
        appointmentServices: {
          include: {
            service: {
              select: { id: true, name: true },
            }
          }
        }
      },
    });
    return appt ?? null;
  }

  

  async create(dto: any, customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    
    const requestStartAt = this.timeRange.validateDateFormat(dto.appointmentStartAt);

    this.timeRange.validateNotPast(requestStartAt);

    this.timeRange.validateSlotMinutes(requestStartAt, 15);

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

    const services = await this.prisma.service.findMany({
      where: { id: { in: dto.serviceIds } },
      select: { duration: true },
    });

    if (!services.length) throw new NotFoundException("Hizmet bulunamadı");
    if (services.length !== dto.serviceIds.length) throw new NotFoundException("Bazı hizmetler yok");
    const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
    const apptStartAt = dayjs(dto.appointmentStartAt);
    const apptEndAt = apptStartAt.add(totalDuration, "minute");

    await this.work.workingValidate(dto, apptStartAt, apptEndAt);

    const hasConflict = await this.conflict.conflictValidate(dto, apptStartAt, apptEndAt);
    if (hasConflict == false) {
      throw new ConflictException('Randevu saatinde başka bir randevu var.');
    }

    try {
      let appt;
      await this.prisma.$transaction(async (tx) => {
        appt = await tx.appointment.create({
          data: { barberId: dto.barberId, customerId, appointmentStartAt: new Date(dto.appointmentStartAt), appointmentEndAt: apptEndAt.toDate(), notes: dto.notes },
        });
        await tx.appointmentService.createMany({
          data: dto.serviceIds.map((id: number) => ({ appointmentId: appt.id, serviceId: id })),
        });
      });

      const dateStr = apptStartAt.toDate().toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });

      const timeStr = apptStartAt.format("HH:mm");
      await this.push.notify(
        customerId,
        'customer',
        'Randevu oluşturuldu',
        `${dateStr} saat ${timeStr} için ${barber.firstName} ${barber.lastName} ile randevunuz oluşturuldu.`
      );
      await this.push.notify(
        barber.id,
        'barber',
        'Yeni bir randevunuz var',
        `${customer.firstName} ${customer.lastName}, ${dateStr} saat ${timeStr} için randevu oluşturdu.`
      );
      return appt;
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

  async cancelByCustomer(customerId: number, appointmentId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');

    if (appt.status != 'SCHEDULED') throw new BadRequestException('Randevu iptal edilemez');

    const result = await this.prisma.appointment.update({ 
      where: { 
        id: appointmentId 
      } ,
      data: {
        status: 'CANCELLED'
      }
    });
    const apptStartAt = dayjs(result.appointmentStartAt);
    const dateStr = apptStartAt.toDate().toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
      });

    const timeStr = apptStartAt.format("HH:mm");
    await this.push.notify(
      customerId, 
      'customer', 
      'Randevunuz iptal edildi', 
      `${dateStr} saat ${timeStr} tarihli randevunuz iptal edildi.`);
    return { message: 'Randevu iptal edildi', result};
  }

  async getAvailableDates(customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    return await this.dateRangeService.getAvailableDates();
  }

  async getAvailableHours(customerId: number, barberId: number, date: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    
    if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');
    const strictDate = dayjs(date, "YYYY-MM-DD", true);
    if (!strictDate.isValid()) {
        throw new BadRequestException("Geçersiz bir tarih girdiniz.");
    }

    const allHours = await this.workinHours.getDailyHours(barberId, date);
    const busyHours = await this.workinHours.getBusyHours(barberId, date);
    return {
      allHours,
      busyHours,
    }
  }

  async findOneForBarber(barberId: number, appointmentId: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });
 
    if (!barber) throw new NotFoundException('Berber bulunamadı');

    const appts = await this.prisma.appointment.findFirst({
      where: { 
        id: appointmentId,
        barberId
      },  
      include: { 
        appointmentServices: {
          include: {
            service: {
              select: { id: true, name: true }
            }
          }
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true, email: true }
        }
      },
    });
    if (!appts) throw new NotFoundException('Randevu bulunamadı');
    return appts;
  }

  async findForBarber(barberId: number, date: string) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });
 
    if (!barber) throw new NotFoundException('Berber bulunamadı');
    const start = dayjs(date).startOf('day').toDate();
    const end = dayjs(date).add(1, 'day').startOf('day').toDate();

    const appts = await this.prisma.appointment.findMany({
      where: { 
        barberId,
        appointmentStartAt: {
          ...(date ? { gte: start, lt: end} : {}),
        },
      },
      orderBy: { createdAt: 'desc' },
      
      include: { 
        appointmentServices: {
          include: {
            service: {
              select: { id: true, name: true }
            }
          }
        },
        customer: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
    });
    if (!appts) throw new NotFoundException('Randevu bulunamadı');
    return appts;
  }

  async findBarberTodayAppointments(barberId: number) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: barberId },
    });
 
    if (!barber) throw new NotFoundException('Berber bulunamadı');
    const today = dayjs().tz('Europe/Istanbul').format('YYYY-MM-DD');
    const start = dayjs(today).startOf('day').toDate();
    const end = dayjs(today).add(1, 'day').startOf('day').toDate();

    const appts = await this.prisma.appointment.findMany({
      where: { 
        barberId,
        appointmentStartAt: { gte: start, lt: end },
      },
      orderBy: { appointmentStartAt: 'desc' },
      
      include: { 
        appointmentServices: {
          include: {
            service: {
              select: { id: true, name: true }
            }
          }
        },
        customer: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
    });
    if (!appts) throw new NotFoundException('Randevu bulunamadı');
    return appts;
  }

  async markCancel(adminId: number, appointmentId: number, dto: MarkAppointmentDto) {
    const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })
    if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}
    
    const markAppointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    
    if (!markAppointment) throw new NotFoundException('Randevu bulunamadı');
    if (markAppointment.status == "CANCELLED") {throw new BadRequestException("Bu randevu zaten iptal edilmiş")}
    if (markAppointment.status != "SCHEDULED" && markAppointment.status != "EXPIRED") {throw new BadRequestException("Bu randevu iptal edildi olarak işaretlenemez")}
    
    try {
      await this.prisma.appointment.update({where: {id: appointmentId}, data: {cancelReason: dto.cancelReason, status: "CANCELLED", cancelledAt: new Date() }})
      const barber = await this.prisma.barber.findUnique({ where: { id: markAppointment.barberId } });
      const apptStartAt = dayjs(markAppointment.appointmentStartAt);
      const startStr = apptStartAt.format("MM-DD HH:mm");
      const weekDay = apptStartAt.toDate().toLocaleDateString('tr-TR', { weekday: 'long' });

      const reason = dto.cancelReason?.trim();
      const base = `${startStr} - ${weekDay} tarihinde aldığınız berber ${barber?.firstName} ${barber?.lastName} için randevunuz iptal edildi.`;
      const body = reason ? `${base} Sebep: ${reason}.` : base;

      if (markAppointment.customerId) {
        await this.push.notify(
          markAppointment.customerId,
          'customer',
          'Randevunuz iptal edildi',
          body
        );
      }
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
    if (markAppointment.status == "COMPLETED") {throw new BadRequestException("Bu randevu zaten tamamlandı")}
    if (markAppointment.status != "SCHEDULED" && markAppointment.status != "EXPIRED") {throw new BadRequestException("Bu randevu iptal edildi olarak işaretlenemez")}

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
    if (markAppointment.status == "NO_SHOW") {throw new BadRequestException("Bu randevu zaten gelinmedi olarak işaretlenmiş")}
    if (markAppointment.status != "SCHEDULED" && markAppointment.status != "EXPIRED") {throw new BadRequestException("Bu randevu iptal edildi olarak işaretlenemez")}
    try {
      await this.prisma.appointment.update({where: {id: appointmentId}, data: {status: "NO_SHOW"}})
      return {message: "Randevuya gelinmedi olarak işaretlendi"}
    } catch (error) {
      throw new Error(error)
    }
  }

  async markCompletedForBarber(barberId: number, appointmentId: number) {
    const barber = await this.prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber) throw new UnauthorizedException('Berber bulunamadı');

    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId, barberId },
    });

    if (!appt) throw new NotFoundException('Randevu bulunamadı');
    if (appt.status == "COMPLETED") {throw new BadRequestException("Bu randevu zaten tamamlandı")}
    if (appt.status != "SCHEDULED" && appt.status != "EXPIRED") {throw new BadRequestException("Bu randevu iptal edildi olarak işaretlenemez")}
    try {
      await this.prisma.appointment.update({where: {id: appointmentId}, data: {status: "COMPLETED"}})
      return {message: "Randevu onaylandı olarak işaretlendi"}
    } catch (error) {
      throw new Error(error)
    }
  }

  async markNoShowForBarber(barberId: number, appointmentId: number) {
    const barber = await this.prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber) throw new UnauthorizedException('Berber bulunamadı');

    const appt = await this.prisma.appointment.findUnique({
      where: { id: appointmentId, barberId },
    });

    if (!appt) throw new NotFoundException('Randevu bulunamadı');
    if (appt.status == "COMPLETED") {throw new BadRequestException("Bu randevu zaten tamamlandı")}
    if (appt.status != "SCHEDULED" && appt.status != "EXPIRED" ) {throw new BadRequestException("Bu randevu gelinmedi olarak işaretlenemez")}
    try {
      await this.prisma.appointment.update({where: {id: appointmentId}, data: {status: "NO_SHOW"}})
      return {message: "Randevu gelinmedi olarak işaretlendi"}
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
    if (appt.status != 'SCHEDULED') throw new BadRequestException('Randevu iptal edilemez');
    await this.prisma.appointment.update({ where: { id: appointmentId }, data: { status: "BARBER_CANCELLED", cancelReason: dto.cancelReason, cancelledAt: new Date() } });

    const apptStartAt = dayjs(appt.appointmentStartAt);
    const startStr = apptStartAt.format("MM-DD HH:mm");
    const weekDay = apptStartAt.toDate().toLocaleDateString('tr-TR', { weekday: 'long' });

    const reason = dto.cancelReason?.trim();
    const base = `${startStr} - ${weekDay} tarihinde ${barber.firstName} ${barber.lastName} için randevunuz iptal edildi.`;
    const body = reason ? `${base} Sebep: ${reason}.` : base;

    if (appt.customerId) {
      await this.push.notify(
        appt.customerId,
        'customer',
        'Randevunuz iptal edildi',
        body
      );
    }
    return { message: 'Randevu iptal edildi' };
  }

  async addBreak(barberId: number, dto: BreakDto) {
    const barber = await this.prisma.barber.findUnique({ where: { id: barberId } });
    if (!barber) throw new NotFoundException("Berber bulunamadı");

    if (dto.endMin <= dto.startMin) throw new BadRequestException("Geçersiz saat aralığı");

    const day = dayjs();
    const work = await this.prisma.workingHour.findFirst({
      where: { barberId, dayOfWeek: day.day() },
    });
    if (!work) throw new NotFoundException("Bugün çalışma saati tanımlı değil");

    if (dto.startMin < work.startMin || dto.endMin > work.endMin) {
      throw new BadRequestException("Geçersiz saat aralığı");
    }

    const start = day.startOf("day").add(dto.startMin, "minute").toDate();
    const end = day.startOf("day").add(dto.endMin, "minute").toDate();

    try {
      return await this.prisma.$transaction(async (tx) => {
        const breakPeriod = await tx.breakPeriod.create({
          data: {
            barberId,
            workingHourId: work.id,
            startMin: dto.startMin,
            endMin: dto.endMin,
          },
        });

        const cancelledAppts = await tx.appointment.findMany({
          where: {
            barberId,
            status: Status.SCHEDULED,
            appointmentStartAt: { lt: end },
            appointmentEndAt: { gt: start },
          },
          select: { id: true, customerId: true },
        });

        await tx.appointment.updateMany({
          where: {
            id: { in: cancelledAppts.map(a => a.id) },
          },
          data: {
            status: Status.BARBER_CANCELLED,
            cancelReason: "Berber mola verdi",
            cancelledAt: new Date(),
          },
        });
 
        for (const appt of cancelledAppts) {
          if (appt.customerId) {
            await this.push.notify(
              appt.customerId,
              'customer',
              'Randevunuz iptal edildi',
              'Berber mola verdiği için randevunuz iptal edildi.'
            );
          }
        }
          
        return { message: "Mola eklendi ve çakışan randevular iptal edildi.", breakPeriod };
      });
    } catch (error) {
      throw this.handleWorkinHourError(error);
    }
  }

  async deleteBreak(barberId: number, id: number) {
    const barber = await this.prisma.barber.findUnique({ where: { id: barberId }});
    if (!barber) throw new NotFoundException("Berber bulunamadı");
    const breakPeriod = await this.prisma.breakPeriod.findUnique({ where: { id, barberId: barberId } });
    if (!breakPeriod) throw new NotFoundException("Mola bulunamadı");
    try {
      await this.prisma.breakPeriod.delete({ where: { id: id, barberId: barberId } });
      return { message: "Mola silindi" };
    } catch (error) {
      throw Error(error);
    }
  }

  async getBreaks(barberId: number) {
    const barber = await this.prisma.barber.findUnique({ where: { id: barberId }});
    if (!barber) throw new NotFoundException("Berber bulunamadı");
    const breakPeriod = await this.prisma.breakPeriod.findMany({ 
      where: { barberId: barberId }, 
      include: { workingHour: true }
    });
    if (breakPeriod.length === 0) return [];
    return breakPeriod
  }

  private handleUniqueError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if(e.code === 'P2002'){
        const t = String(e.meta?.target ?? '');
        if (t.includes('barberId') && t.includes('appointmentStartAt')) {
          throw new ConflictException('Bu saat için berber zaten dolu');
        }
        if (t.includes('customerId')) {
          throw new ConflictException('Zaten bir randevunuz var');
        }
        throw new ConflictException('Tekrarlanan kayıt');
      }
      
      if (
        e.message.includes('no_barber_overlap') ||
        e.message.includes('exclusion constraint')
      ) {
        throw new ConflictException(
          'Bu saat aralığında berberin başka bir randevusu var'
        );
      }
    }
    throw e;
  }

  private handleWorkinHourError(e:unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const t = String(e.meta?.target ?? '');
      if (t.includes('workingHourId') && t.includes('startMin') && t.includes('endMin')) {
        throw new ConflictException('Bu süre için mola zaten var');
      }
    
    }
    throw e;
  }

}
