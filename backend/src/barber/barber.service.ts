import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBarberDto } from './dto/create-barber.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ActivityBarberDto } from './dto/activity-barber.dto';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class BarberService {
    constructor(private prisma: PrismaService, private config: ConfigService) {}

    async create(dto: CreateBarberDto, adminId: number) {
        const admin = await this.prisma.admin.findUnique({
            where: {
                id: adminId
            }
        })

        if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}
        const hashedPassword =  await bcrypt.hash(dto.password, 12)
        
        try {
            const barber = await this.prisma.barber.create({
                data: {
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    phone: dto.phone,
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

    async findAll() {
        const baseUrl = this.config.get<string>('APP_BASE_URL');
        const barbers = await this.prisma.barber.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                active: true,
                image: true
            }
        });
        if(!barbers) {throw new NotFoundException("Berber bulunamadı")}


        return barbers.map(b => ({
            ...b,
            image: b.image ? `${baseUrl}/${b.image}` : null
        }));
    }

    async findOne(adminId: number, barberId: number) {
        const baseUrl = this.config.get<string>('APP_BASE_URL');
        const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })

        if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}

        const barber = await this.prisma.barber.findUnique({
            where: {
                id: barberId
            },
            select: {
                id: true,
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
        const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })

        if(!admin) {throw new UnauthorizedException("Admin bulunamadı")}

        const barber = await this.prisma.barber.findUnique({
            where: {
                id: barberId
            }
        });

        if(!barber) {throw new NotFoundException("Berber bulunamadı")}

        this.prisma.barber.delete({
            where: {
                id: barberId
            }
        })

        return {
            message: "Berber başarıyla silindi"
        }
        
    }

    async update(adminId: number, barberId: number, dto: ActivityBarberDto) {
        const admin = await this.prisma.admin.findUnique({ where: {id: adminId } })
        if (!admin) {throw new UnauthorizedException("Admin bulunamadı")}
        const barber = await this.prisma.barber.findUnique({ where: {id: barberId } })
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

    async uploadImage(barberId: number, imageUrl: string) {
        const barber = await this.prisma.barber.findUnique({
            where: { id: barberId }
        });

        if (!barber) {
            throw new UnauthorizedException("Berber bulunamadı");
        }

        
        const isImageExists = await this.prisma.barber.findUnique({
            where: { id: barberId },
            select: { image: true }
        });
        
        
        if (isImageExists?.image != null) {
            throw new ConflictException("Zaten bir resim bulunmakta");
        }

        await this.prisma.barber.update({
            where: { id: barberId },
            data: { image: imageUrl }
        });
        
        return { message: "Resim başarıyla yüklendi" };
    }

    async deleteImage(barberId: number) {
        const barber = await this.prisma.barber.findUnique({
            where: { id: barberId }
        });

        if (!barber) {
            throw new UnauthorizedException("Berber bulunamadı");
        }

        await this.prisma.barber.update({
            where: { id: barberId },
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
