import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateShopDto } from './dto/create.dto';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

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

        const slug = this.createSlug(dto.district, dto.neighborhood, dto.name)
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

    async findAll() {
        const shops = await this.prisma.shop.findMany({where: {active: true}});
        return shops.map((shop) => ({
            ...shop,
            image: shop.image ? `${process.env.APP_BASE_URL}/${shop.image}` : `${process.env.APP_BASE_URL}/${"uploads/services/default-service.png"}`
        }));
    }

    async activity(shopId: number, activity: boolean) {
        const shop = await this.prisma.shop.findUnique({where: {id: shopId}})
        if (!shop) throw new NotFoundException('İşletme bulunamadı')
        return await this.prisma.shop.update({where: {id: shop.id}, data: {active: activity}})
    }

    async uploadImage(shopId: number, imageUrl: string) {
        const shop = await this.prisma.shop.findUnique({where: {id: shopId}})
        if (!shop) throw new NotFoundException('İşletme bulunamadı')
        if (shop.image != null) {
            throw new ConflictException("Zaten bir resim bulunmakta");
        }
        await this.prisma.shop.update({where: {id: shop.id, active: true}, data: {image: imageUrl}})
        return { message: "Resim başarıyla yüklendi" };
    }

    async deleteImage(shopId: number) {
        const shop = await this.prisma.shop.findUnique({where: {id: shopId}})
        if (!shop) throw new NotFoundException('İşletme bulunamadı')
        const image = shop.image
        if (image == null) {
            throw new ConflictException("Zaten bir resim bulunmamaktadır");
        } else {
            await this.prisma.shop.update({where: {id: shop.id}, data: {image: null}})

            if (image && !image.includes('default-service.png')) {
                const filePath = path.resolve(process.cwd(), image);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (e) {
                        console.warn('Dosya silinemedi:', e);
                    }
                }
            }
            return { message: "Resim başarıyla silindi" };
        }
    }

    private createSlug(district: string, neighborhood: string, name: string) {
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
