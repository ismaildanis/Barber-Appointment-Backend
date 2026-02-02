import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ActivityBarberDto } from './dto/activity-barber.dto';
import { ConfigService } from '@nestjs/config';
import { UpdateBarberDto } from './dto/update-barber.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BarberService {
    constructor(private prisma: PrismaService, private config: ConfigService) {}

    async create(dto: CreateBarberDto, adminId: number) {

        const admin = await this.prisma.admin.findUnique({
            where: {
                id: adminId
            },
            include: {
                shop: {
                    select: {
                        active: true
                    }
                }
            }
        })

        if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}
        if(!admin.shop.active) {throw new ConflictException("İşletme aktif değil")}
        const email = dto.email;

        const exists =
            (await this.prisma.customer.findUnique({ where: { email } })) ||
            (await this.prisma.barber.findUnique({ where: { email } })) ||
            (await this.prisma.admin.findUnique({ where: { email } }));

        if (exists) throw new ConflictException('Bu email kullanılıyor başka bir email deneyin.');
        
        const hashedPassword =  await bcrypt.hash(dto.password, 12)
        
        try {
            const barber = await this.prisma.barber.create({
                data: {
                    shopId: admin.shopId,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    phone: dto.phone ?? null,
                    password: hashedPassword,
                }
            })

            return {
                message: "Kayıt Başarıyla Tamamlandı",
                barber: barber.id
            }
        } catch (e) {
            this.handleUniqueError(e);
        }
    }

    async findForAdmin(shopId: number) {
        const shop = await this.prisma.shop.findFirst({ where: {id: shopId } })
        if(!shop) {throw new UnauthorizedException("İşletme bulunamadı")}

        const baseUrl = this.config.get<string>('APP_BASE_URL');
        const barbers = await this.prisma.barber.findMany({
            where: { shopId: shopId, deletedAt: null },
            select: {
                id: true,
                shopId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                active: true,
                image: true
            }
        });
        if(barbers.length == 0) {throw new NotFoundException("Berber bulunamadı")}

        return barbers.map(b => ({
            ...b,
            image: b.image ? `${baseUrl}/${b.image}` : `${baseUrl}/${"uploads/barbers/default-barber.png"}`
        }));
    }

    async findAllForShop(slug: string) {
        const shop = await this.prisma.shop.findUnique({
            where: {
                slug: slug
            }
        })
        if(!shop) {throw new NotFoundException("İşletme bulunamadı")}
        const baseUrl = this.config.get<string>('APP_BASE_URL');
        const barbers = await this.prisma.barber.findMany({
            where: { shopId: shop.id, deletedAt: null },
            select: {
                id: true,
                shopId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                active: true,
                image: true
            }
        });
        if(barbers.length == 0) {throw new NotFoundException("Berber bulunamadı")}


        return barbers.map(b => ({
            ...b,
            image: b.image ? `${baseUrl}/${b.image}` : `${baseUrl}/${"uploads/barbers/default-barber.png"}`
        }));
    }

    async findOne(adminId: number, barberId: number) {
        const baseUrl = this.config.get<string>('APP_BASE_URL');
        const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })

        if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}

        const barber = await this.prisma.barber.findUnique({
            where: {
                id: barberId,
                shopId: admin.shopId,
                deletedAt: null
            },
            select: {
                id: true,
                shopId: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                active: true,
                image: true
            }
        });

        if(!barber) {throw new NotFoundException("Berber bulunamadı")}

        return {
            ...barber,
            image: barber.image ? `${baseUrl}/${barber.image}` : `${baseUrl}/${"uploads/barbers/default-barber.png"}`
        }
    }

    async delete(adminId: number, barberId: number) {
        const admin = await this.prisma.admin.findUnique({ where: {id: adminId }, include: {shop: {select: {active: true}}}})

        if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}
        if(!admin.shop.active) {throw new ConflictException("İşletme aktif değil")}
        const barber = await this.prisma.barber.findUnique({
            where: {
                deletedAt: null,
                id: barberId
            }
        });

        if(!barber) {throw new NotFoundException("Berber bulunamadı")}

        await this.prisma.barber.update({
            where: {
                id: barberId, deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        })

        return {
            message: "Berber başarıyla silindi"
        }
        
    }

    async update(adminId: number, barberId: number, dto: ActivityBarberDto) {
        const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })
        if (!admin) {throw new UnauthorizedException("Admin bulunamadı")}
        const barber = await this.prisma.barber.findUnique({ where: {id: barberId, deletedAt: null } })
        if (!barber) {throw new NotFoundException("Berber bulunamadı")}
        try {
            await this.prisma.barber.update({
                data: {
                    active: dto.active  
                },
                where: {
                    id: barberId
                }
            })
            return { message: "Başarılı" }
        } catch (error) {
            throw new Error(error)
        }
    }

    async updateBarber(barberId: number, dto: UpdateBarberDto) {
        const barber = await this.prisma.barber.findUnique({ where: {id: barberId, deletedAt: null } })
        if (!barber) {throw new NotFoundException("Berber bulunamadı")}
        try {
            await this.prisma.barber.update({
                data: {
                    ...dto 
                },
                where: {
                    id: barberId
                }
            })
            return { message: "Başarılı" }
        } catch (error) {
            throw new Error(error)
        }
    }

    async uploadImage(barberId: number, imageUrl: string) {
        const barber = await this.prisma.barber.findUnique({
            where: { id: barberId, deletedAt: null }
        });

        if (!barber) {
            throw new UnauthorizedException("Berber bulunamadı");
        }

        
        const isImageExists = await this.prisma.barber.findUnique({
            where: { id: barberId, deletedAt: null },
            select: { image: true }
        });
        
        
        if (isImageExists?.image != null) {
            throw new ConflictException("Zaten bir resim bulunmakta");
        }

        await this.prisma.barber.update({
            where: { id: barberId, deletedAt: null },
            data: { image: imageUrl }
        });
        
        return { message: "Resim başarıyla yüklendi" };
    }

    async deleteImage(barberId: number) {
        const barber = await this.prisma.barber.findUnique({
            where: { id: barberId, deletedAt: null }
        });

        if (!barber) {
            throw new UnauthorizedException("Berber bulunamadı");
        }

        const image = barber.image;

        if (image && !image.includes('default-barber.png')) {
            const filePath = path.resolve(process.cwd(), image);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.warn('Dosya silinemedi:', e);
                }
            }
        }

        await this.prisma.barber.update({
            where: { id: barberId, deletedAt: null },
            data: { image: null }
        });


        return { message: "Resim başarıyla silindi" };
    }

    private handleUniqueError(e: unknown): never {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            const t = String(e.meta?.target ?? '');
            if (t.includes('email')) {
            throw new ConflictException('Bu berber zaten kayıtlı');
            }
            throw new ConflictException('Tekrarlanan kayıt');
        }
        throw e;
    }

}
