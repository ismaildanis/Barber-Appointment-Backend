import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BarberAuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService
    ) {}

    async login(dto) {
        const barber = await this.prisma.barber.findUnique({where: { email: dto.email }})

        if(!barber) {
            throw new UnauthorizedException("Email veya şifre yanlış")
        }

        const passwordMatched = await bcrypt.compare(dto.password, barber.password)

        if (!passwordMatched) {
            throw new UnauthorizedException("Email veya şifre yanlış")
        }

        const {accessToken, refreshToken} = await this.generateToken(barber.id, barber.email)
        
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12)

        await this.prisma.barber.update({
            where: {
                id: barber.id,
            },
            data: {
                refreshToken: hashedRefreshToken
            }
        })

        return {
            message: "Giriş başarılı",
            barber: barber.id,
            accessToken,
            refreshToken,
        }
    }

    async refreshTokens(barberId: number) {
        const barber = await this.prisma.barber.findUnique({
            where: { id: barberId },
        });

        if (!barber || !barber.refreshToken) {
            throw new UnauthorizedException('Refresh token bulunamadı');
        }

        const accessToken = await this.jwt.signAsync(
            { sub: barberId },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: process.env.JWT_EXPIRES_IN,
            },
        );

        const newRefreshToken = await this.jwt.signAsync(
            { sub: barberId },
            {
                secret: process.env.REFRESH_SECRET,
                expiresIn: process.env.REFRESH_EXPIRES_IN,
            },
        );

        const hashed = await bcrypt.hash(newRefreshToken, 12);

        await this.prisma.barber.update({
            where: { id: barberId },
            data: { refreshToken: hashed },
        });

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }


    async logout(barberId: number) {

        const barber = await this.prisma.barber.findUnique({
            where: {
                id: barberId
            }
        })

        if(!barber) {
            throw new UnauthorizedException("Berber bulunamadı")
        }

        await this.prisma.barber.update({
            where: {
                id: barberId
            },
            data: {
                refreshToken: null
            }
        })

        return {
            message: "Çıkış başarılı"
        }
    }

    async getMe(barberId: number) {

        const barber = await this.prisma.barber.findUnique({
            where: {
                id: barberId
            }
        })

        if(!barber) {
            throw new UnauthorizedException("Kullanıcı bulunamadı")
        }

        return {
            id: barber.id,
            email: barber.email,
            firstName: barber.firstName,
            lastName: barber.lastName,
            phone: barber.phone
        }
    }

    async generateToken(barberId: number, email:string) {

        const accessToken = await this.jwt.signAsync(
            {sub: barberId, email},
            {
                secret: process.env.JWT_SECRET!,
                expiresIn: process.env.JWT_EXPIRES_IN!,
            }
        )

        const refreshToken = await this.jwt.signAsync(
            { sub: barberId, email}, 
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
