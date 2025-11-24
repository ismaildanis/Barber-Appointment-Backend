import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppointmentService {
  constructor(private prisma: PrismaService) {}

  async findAll(customerId: number) {
    return this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { appointmentAt: 'asc' },
    });
  }

  async findOne(appointmentId: number, customerId: number) {
    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');
    return appt;
  }

  async create(dto: any, customerId: number) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Kullanıcı bulunamadı');

    const customerAppt = await this.prisma.appointment.findFirst({ where: { customerId } });
    if (customerAppt) throw new ConflictException('Zaten randevunuz var');

    const barber = await this.prisma.barber.findUnique({ where: { id: dto.barberId } });
    if (!barber) throw new NotFoundException('Berber bulunamadı');

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
    if (!customer) throw new NotFoundException('Kullanıcı bulunamadı');

    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');

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
    if (!customer) throw new NotFoundException('Kullanıcı bulunamadı');

    const appt = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
    });
    if (!appt) throw new NotFoundException('Randevu bulunamadı');

    await this.prisma.appointment.delete({ where: { id: appointmentId } });
    return { message: 'Randevu silindi' };
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
