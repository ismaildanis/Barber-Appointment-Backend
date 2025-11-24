import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AppointmentService 
{
    constructor(
        private prisma: PrismaService
    ) {}

    async findAll(customerId: number) {
    return this.prisma.appointment.findMany({
        where: { customerId },
        orderBy: { appointmentAt: 'asc' },
    });
    }

    async findOne(appointmentId, customerId)
    {
        const appt = await this.prisma.appointment.findFirst({
            where: {
                id: appointmentId, 
                customerId: customerId
            }
        })

        if(!appt){
            throw new NotFoundException("Randevu bulunamadı")
        }
        return appt
    }

    async create(dto, customerId) {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id: customerId
            }
        })
        
        if(!customer){
            throw new NotFoundException("Kullanıcı bulunamadı")
        }

        const barber = await this.prisma.barber.findUnique({
            where: {
                id: dto.barberId
            }
        })

        if(!barber){
            throw new NotFoundException("Berber bulunamadı")
        }

        return this.prisma.appointment.create({
            data: {
                ...dto,
                customerId,
                appointmentAt: new Date(dto.appointmentAt)
            }
        })
    }

    async update(dto, customerId, appointmentId)
    {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id: customerId
            }
        })
        
        if(!customer){
            throw new NotFoundException("Kullanıcı bulunamadı")
        }

        const appt = await this.prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        })

        if(!appt){
            throw new NotFoundException("Randevu bulunamadı")
        }

        return await this.prisma.appointment.update({
            where: {
                id: appointmentId,
            },

            data: {
                ...dto,
                customerId,
                appointmentAt: new Date(dto.appointmentAt)
            }
        })
    }

    async delete(customerId, appointmentId)
    {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id: customerId
            }
        })
        
        if(!customer){
            throw new NotFoundException("Kullanıcı bulunamadı")
        }

        const appt = await this.prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        })

        if(!appt){
            throw new NotFoundException("Randevu bulunamadı")
        }

        await this.prisma.appointment.delete({
            where: {
                id: appointmentId
            }
        })

        return {message: "Randevu silindi"}
    }
}
