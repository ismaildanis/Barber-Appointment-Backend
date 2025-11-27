import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';



@Injectable()
export class AuthService 
{
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService
    ) {}

    async register(dto: RegisterDto)
    {
        const existing = await this.prisma.customer.findUnique({
            where: {
                email: dto.email,
            }
        });

        if(existing){
            throw new ConflictException("Email already exists")
        }

        const hashedPassword =  await bcrypt.hash(dto.password, 12)

        const customer = await this.prisma.customer.create({
            data: {
                firstName: dto.firstName,
                lastName: dto.lastName,
                email: dto.email,
                phone: dto.phone,
                password: hashedPassword,
            }
        })

        return {
            message: "Kayıt Başarıyla Tamamlandı",
            customerId: customer.id
        }
    }

    async login(dto: LoginDto)
    {
        const customer = await this.prisma.customer.findUnique({
            where: {
                email: dto.email,
            }
        })

        if(!customer){
            throw new UnauthorizedException("Email veya şifre yanlış")
        }

        const passwordMatched = await bcrypt.compare(dto.password, customer.password)

        if (!passwordMatched){
            throw new UnauthorizedException("Email veya şifre yanlış")
        }

        const {accessToken, refreshToken} = await this.generateTokens(customer.id, customer.email)

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);

        await this.prisma.customer.update({
            where: {
                id: customer.id,
            },
            data: {
                refreshToken: hashedRefreshToken,
            },
        });

        return {
            message: "Giriş başarılı",
            customerId: customer.id,
            accessToken,
            refreshToken,
        }
    }

    async getMe(customerId: number)
    {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id: customerId,
            }
        })

        if(!customer){
            throw new UnauthorizedException("Kullanıcı bulunamadı")
        }
        return {
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
        }
    }

    async logout(customerId: number)
    {
        const customer = await this.prisma.customer.findUnique({
            where: {
                id: customerId,
            }
        })

        if(!customer){
            throw new UnauthorizedException("Kullanıcı bulunamadı")
        }
        
        await this.prisma.customer.update({
            where: {
                id: customerId,
            },
            data: {
                refreshToken: null,
            },
        });


        return {
            message: "Çıkış başarılı",
        }
    }
    async refreshTokens(customerId: number) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
        });

        if (!customer || !customer.refreshToken) {
            throw new UnauthorizedException('Refresh token bulunamadı');
        }

        // Yeni token üret
        const accessToken = await this.jwt.signAsync(
            { sub: customerId },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        const newRefreshToken = await this.jwt.signAsync(
            { sub: customerId },
            {
                secret: process.env.REFRESH_SECRET,
                expiresIn: process.env.REFRESH_EXPIRES_IN,
            }
        );

        const hashed = await bcrypt.hash(newRefreshToken, 12);

        await this.prisma.customer.update({
            where: { id: customerId },
            data: { refreshToken: hashed },
        });

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    async generateTokens(customerId: number, email:string)
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
