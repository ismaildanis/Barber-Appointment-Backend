import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomerService {
    constructor(private readonly prisma: PrismaService) {}

    async update(customerId: number, dto: UpdateCustomerDto) {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id: customerId,
            },
        })
        if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');


        const exists = await this.prisma.customer.findFirst({
            where: {
                id: { not: customerId },
                phone: dto.phone,
            },
        })
        if (exists) throw new ConflictException('Bu telefon numarası kullanılıyor başka bir telefon numarası deneyin.');
        await this.prisma.customer.update({
            where: {
                id: customerId,
            },
            data: {
                ...dto,
            },
        });
        return { message: "Başarılı" }
    }
    
}
