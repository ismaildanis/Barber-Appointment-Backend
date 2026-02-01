import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShopDto } from './dto/create.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ShopService {
    constructor(private prisma: PrismaService) {}

    async create(dto: CreateShopDto) {
        const emailExists = await this.prisma.shop.findUnique({
            where: {
                email: dto.email
            }
        })
        if (emailExists) {
            throw new ConflictException('Bu email kullanılıyor başka bir email deneyin.');
        }

        const slug = await this.createSlug(dto.district, dto.neighborhood, dto.name)
        const hashedPassword = await bcrypt.hash(dto.adminPassword, 12)

        return await this.prisma.$transaction(async (tx) => {
            const shop = await tx.shop.create({
                data: {
                    slug,
                    name: dto.name,
                    email: dto.email,
                    city: dto.city,
                    district: dto.district,
                    neighborhood: dto.neighborhood,
                    address: dto.address,
                    phone: dto.phone ?? null,
                }
            })

            await tx.admin.create({
                data: {
                    shopId: shop.id,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    phone: dto.adminPhone ?? null,
                    email: dto.adminEmail,
                    password: hashedPassword,
                }
            })

            return shop
        })

    }

    async createSlug(district: string, neighborhood: string, name: string) {
        const normalize = (s: string) =>
        s
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');

            const slug = `${normalize(district)}-${normalize(neighborhood)}-${normalize(name)}`;

        return slug
    }
}
