import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt } from 'crypto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { Expo } from 'expo-server-sdk';
const expo = new Expo();
@Injectable()
export class AdminAuthService {

    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private mailer: MailerService
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
            role: "admin",
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
            role: "admin",
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

        await this.prisma.pushToken.deleteMany({
            where: { 
                userId: adminId,
                role: "admin"
            }
        });

        return { message: "Çıkış Başarılı" }
    }
    async refreshTokens(adminId: number) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });

        if (!admin || !admin.refreshToken) {
            throw new UnauthorizedException('Refresh token bulunamadı');
        }

        const accessToken = await this.jwt.signAsync(
            { sub: adminId, role: "admin" },
            {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );

        const newRefreshToken = await this.jwt.signAsync(
            { sub: adminId, role: "admin" },
            {
            secret: process.env.REFRESH_SECRET,
            expiresIn: process.env.REFRESH_EXPIRES_IN,
            }
        );

        const hashed = await bcrypt.hash(newRefreshToken, 12);

        await this.prisma.admin.update({
            where: { id: adminId },
            data: { refreshToken: hashed },
        });

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }


    async generateToken(customerId: number, email:string)
    {   
        const accessToken = await this.jwt.signAsync(
            {sub: customerId, email, role: "admin"},
            {
                secret: process.env.JWT_SECRET!,
                expiresIn: process.env.JWT_EXPIRES_IN!,
            }
        )

        const refreshToken = await this.jwt.signAsync(
            { sub: customerId, email, role: "admin"}, 
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

    async tryLogin(dto: LoginDto) {
        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email }});
        if (!admin) return null;

        const ok = await bcrypt.compare(dto.password, admin.password);
        if (!ok) return null;

        const { accessToken, refreshToken } = await this.generateToken(admin.id, admin.email);
        await this.prisma.admin.update({
            where: { id: admin.id },
            data: { refreshToken: await bcrypt.hash(refreshToken, 12) },
        });

        return {
            message: "Giriş başarılı",
            role: "admin" as const,
            userId: admin.id,
            accessToken,
            refreshToken,
            user: {
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            phone: admin.phone,
            },
        };
    }

    async forgot(dto: { email: string }) {
        const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
        if (!admin) return { message: 'Reset kodu gönderildi' };

        const code = randomInt(0, 1_000_000).toString().padStart(6, '0')

        const tokenHash = await bcrypt.hash(code, 12);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await this.prisma.passwordReset.create({
            data: { email: dto.email, tokenHash: tokenHash, expiresAt },
        });

        this.mailer.sendMail({
            to: dto.email,
            subject: 'Şifre sıfırlama kodu',
            text: `Kodunuz: ${code} (30 dk geçerli)`,
            html: `<p>Kodunuz: <b>${code}</b> (30 dk geçerli)</p>`,
        }).catch(err => {
            console.error('Mail error:', err);
        });

        return { message: "Sıfırlama kodu e-posta ile gönderildi"}
    }

    async verifyReset(dto: { email: string; code: string }) {
        const passwordReset = await this.prisma.passwordReset.findFirst({
            where: { email: dto.email, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });
        if (!passwordReset) return { message: 'Sıfırlama kodu geçersiz' };

        const ok = await bcrypt.compare(dto.code, passwordReset.tokenHash);
        if (!ok) return { message: 'Sıfırlama kodu geçersiz' };

        const resetSessionId = await this.jwt.signAsync(
            { email: dto.email, role: 'admin', purpose: 'password-reset' },
            { secret: process.env.RESET_SECRET, expiresIn: '15m' },
        );

        await this.prisma.passwordReset.update({
            where: { id: passwordReset.id },
            data: { usedAt: new Date() },
        });

        return { resetSessionId, role: 'admin' };
    }

    async resetPassword(email: string, newPassword: string) {
        const admin = await this.prisma.admin.findUnique({ where: { email } });
        if (!admin) return { message: 'Şifre güncellendi' };

        const hashed = await bcrypt.hash(newPassword, 12);
        await this.prisma.admin.update({
            where: { id: admin.id },
            data: {
            password: hashed,
            refreshToken: null,
            },
        });

        return { message: 'Şifre güncellendi' };
    }

    async changePassword(adminId: number, dto: ChangePasswordDto) {
        const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
        if (!admin) throw new UnauthorizedException('Admin bulunamadı');

        const ok = await bcrypt.compare(dto.oldPassword, admin.password);
        if (!ok) return { message: 'Şifre yanlış' };

        const hashed = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.admin.update({
            where: { id: admin.id },
            data: { password: hashed, refreshToken: null },
        });

        return { message: 'Şifre güncellendi' };
    }

    async pushRegister(adminId: number, dto: { token: string }) {
        const token = dto.token;
        if (!Expo.isExpoPushToken(token)) throw new BadRequestException('Geçersiz anahtar');

        await this.prisma.pushToken.upsert({
            where: {
                userId_role: {
                    userId: adminId,
                    role: 'admin',
                },
            },
            update: {
                token,
                updatedAt: new Date(),
            },
            create: {
                userId: adminId,
                role: 'admin',
                token,
            },
        });

        return { ok: true };
    }
}
