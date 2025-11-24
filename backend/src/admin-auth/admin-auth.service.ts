import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class AdminAuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService
    ) {}

    async login(dto: LoginDto)
    {
        const admin = await this.prisma.admin.findUnique({
            where: {
                email: dto.email
            }
        })

        if (!admin) {
            throw new UnauthorizedException('Email veya şifre yanlış');
        }

        const passwordMatched = await bcrypt.compare(dto.password, admin.password);

        if (!passwordMatched) {
            throw new UnauthorizedException('Email veya şifre yanlış');
        }

        const {accessToken, refreshToken} = await this.generateToken(admin.id, admin.email)

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12)

        await this.prisma.admin.update({
            where: {
                id: admin.id,
            },
            data: {
                refreshToken: hashedRefreshToken
            }
        })

        return {
            message: "Giriş başarılı",
            adminId: admin.id,
            accessToken,
            refreshToken,
        }
    }

    async getMe(adminId: number){
        const admin = await this.prisma.admin.findUnique({
            where: {
                id: adminId
            }
        })

        if(!admin) {
            throw new UnauthorizedException("Admin bulunamadı")
        }

        return {
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            phone: admin.phone,
        }
    }

    async logout(adminId: number){
        const admin = await this.prisma.admin.findUnique({
            where: {
                id: adminId
            }
        })

        if(!admin) {
            throw new UnauthorizedException("Admin bulunamadı")
        }

        await this.prisma.admin.update({
            where:{
                id:adminId
            },
            data:{
                refreshToken: null
            }
        })

        return { message: "Çıkış Başarılı" }
    }

    async generateToken(customerId: number, email:string)
    {   
        const accessToken = await this.jwt.signAsync(
            {sub: customerId, email},
            {
                secret: process.env.JWT_SECRET!,
                expiresIn: process.env.JWT_EXPIRES_IN!,
            }
        )

        const refreshToken = await this.jwt.signAsync(
            { sub: customerId, email}, 
            {
                secret: process.env.REFRESH_SECRET!,
                expiresIn: process.env.REFRESH_EXPIRES_IN!,
            }
        )
        
        return {
            accessToken,
            refreshToken,
        }
    }
}
