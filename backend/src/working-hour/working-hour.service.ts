import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkingHourDto } from './dto/create-working-hour.dto';
import { UpdateWorkingHourDto } from './dto/update-working-hour.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorkingHourService {
    constructor(private prisma: PrismaService) {}

    async getDailyHours(barberId: number) {
        const barber = await this.prisma.barber.findFirst({ where: { id: barberId, deletedAt: null } });
        if (!barber) { throw new UnauthorizedException('Barber bulunamadı')}
        return await this.prisma.workingHour.findMany({ where: { barberId: barberId} });
    }

    async createWorkingHours(barberId: number, dto: CreateWorkingHourDto) {
        const barber = await this.prisma.barber.findFirst({ where: { id: barberId, deletedAt: null } });
        if (!barber) { throw new UnauthorizedException('Barber bulunamadı')}
        if (dto.dayOfWeek < 1 || dto.dayOfWeek > 7) { throw new BadRequestException('Gecersiz gün') }
        try {
            const workingHour = await this.prisma.$transaction(
                async (tx) => await tx.workingHour.create({ 
                data: { ...dto, barberId: barberId } 
            }));
            return workingHour;
        } catch (error) {
            this.handleWorkinHourError(error);
        }
        
        
    }

    async updateWorkingHours(barberId: number, dto: UpdateWorkingHourDto, id: number) {
        const barber = await this.prisma.barber.findFirst({
            where: { id: barberId, deletedAt: null },
        });
        if (!barber) throw new UnauthorizedException('Barber bulunamadı');

        const workingHour = await this.prisma.workingHour.findUnique({ where: { id } });
        if (!workingHour || workingHour.barberId !== barberId) {
            throw new NotFoundException('Çalışma saati bulunamadı');
        }

        return this.prisma.workingHour.update({
            where: { id },
            data: { ...dto },
        });
    }

    async deleteWorkingHours(barberId: number, id: number) {
        const barber = await this.prisma.barber.findFirst({ where: { id: barberId, deletedAt: null } });
        if (!barber) { throw new UnauthorizedException('Barber bulunamadı')}
        const workingHour = await this.prisma.workingHour.findFirst({ where: { id: id } });
        if (!workingHour) throw new NotFoundException('Çalışma saati bulunamadı');
        await this.prisma.workingHour.delete({ where: { id } });
        return workingHour;
    }

    private handleWorkinHourError(e:unknown): never {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            const t = String(e.meta?.target ?? '');
            if (t.includes('dayOfWeek') && t.includes('barberId')) {
            throw new ConflictException('Bu gün için zaten bir çalışma saati tanımlanmış');
            }
        
        }
        throw e;
    }
}
