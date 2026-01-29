import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
    constructor(private readonly prisma: PrismaService) {}

    async update(customerId: number, dto: UpdateCustomerDto) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

        if (dto.phone) {
            const exists = await this.prisma.customer.findFirst({
                where: {
                    id: { not: customerId },
                    phone: dto.phone,
                },
            });

            if (exists) {
                throw new ConflictException(
                    'Bu telefon numarası kullanılıyor, başka bir telefon numarası deneyin.'
                );
            }
        }

        await this.prisma.customer.update({
            where: { id: customerId },
            data: {
                ...dto,
                phone: dto.phone ?? null,
            },
        });

        return { message: 'Başarılı' };
    }

    async delete(customerId: number) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });
        if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

        await this.prisma.$transaction([
            this.prisma.pushToken.deleteMany({
                where: { userId: customerId, role: "customer" },
            }),
            this.prisma.appointment.updateMany({
                where: { customerId, status: "SCHEDULED" },
                data: { status: "CANCELLED", cancelledAt: new Date() },
            }),
            this.prisma.customer.delete({
                where: { id: customerId },
            }),
        ]);
        return { message: 'Başarılı' };
    }
    
}
