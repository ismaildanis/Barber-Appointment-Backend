import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt } from 'crypto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';
import { Expo } from 'expo-server-sdk';

@Injectable()
export class BarberAuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
        private mailer: MailerService
    ) {}

    async login(dto: LoginDto) {
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
            role: "barber",
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
            { sub: barberId, role: "barber" },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: process.env.JWT_EXPIRES_IN,
            },
        );

        const newRefreshToken = await this.jwt.signAsync(
            { sub: barberId, role: "barber" },
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
        const baseUrl = this.config.get<string>('APP_BASE_URL');
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
            phone: barber.phone,
            image: barber.image ? `${baseUrl}/${barber.image}` : `${baseUrl}/${"uploads/barbers/default-barber.png"}`,
            role: "barber",
            active: barber.active
        }
    }

    async generateToken(barberId: number, email:string) {

        const accessToken = await this.jwt.signAsync(
            {sub: barberId, email, role: "barber"},
            {
                secret: process.env.JWT_SECRET!,
                expiresIn: process.env.JWT_EXPIRES_IN!,
            }
        )

        const refreshToken = await this.jwt.signAsync(
            { sub: barberId, email, role: "barber"}, 
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
        const barber = await this.prisma.barber.findUnique({ where: { email: dto.email }});
        if (!barber) return null;

        const ok = await bcrypt.compare(dto.password, barber.password);
        if (!ok) return null;

        const { accessToken, refreshToken } = await this.generateToken(barber.id, barber.email);
        await this.prisma.barber.update({
            where: { id: barber.id },
            data: { refreshToken: await bcrypt.hash(refreshToken, 12) },
        });

        return {
            message: "Giriş başarılı",
            role: "barber" as const,
            userId: barber.id,
            accessToken,
            refreshToken,
            user: {
            id: barber.id,
            firstName: barber.firstName,
            lastName: barber.lastName,
            email: barber.email,
            phone: barber.phone,
            },
        };
    }

    async forgot(dto: { email: string }) {
        const barber = await this.prisma.barber.findUnique({ where: { email: dto.email } });
        if (!barber) return { message: 'Reset kodu gönderildi' };

        const code = randomInt(0, 1_000_000).toString().padStart(6, '0')

        const tokenHash = await bcrypt.hash(code, 12);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await this.prisma.passwordReset.create({
            data: { email: dto.email, tokenHash: tokenHash, expiresAt },
        });
        await this.mailer.sendMail({
            to: dto.email,
            subject: 'Şifre sıfırlama kodu',
            text: `Kodunuz: ${code} (30 dk geçerli)`,
            html: `<p>Kodunuz: <b>${code}</b> (30 dk geçerli)</p>`,
        });
        return { message: "Sıfırlama kodu e-posta ile gönderildi"}
    }
    
    async verifyReset(dto: {  email: string; code: string }) {
        const passwordReset = await this.prisma.passwordReset.findFirst({
            where: { email: dto.email, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });
        if (!passwordReset) return { message: 'Sıfırlama kodu geçersiz' };

        const ok = await bcrypt.compare(dto.code, passwordReset.tokenHash);
        if (!ok) return { message: 'Sıfırlama kodu geçersiz' };

        const resetSessionId = await this.jwt.signAsync(
            { email: dto.email, role: 'barber', purpose: 'password-reset' },
            { secret: process.env.RESET_SECRET, expiresIn: '15m' },
        );

        await this.prisma.passwordReset.update({
            where: { id: passwordReset.id },
            data: { usedAt: new Date() },
        });

        return { resetSessionId, role: 'barber' };
    }

    async resetPassword(email: string, newPassword: string) {
        const barber = await this.prisma.barber.findUnique({ where: { email } });
        if (!barber) return { message: 'Şifre güncellendi' };

        const hashed = await bcrypt.hash(newPassword, 12);
        await this.prisma.barber.update({
            where: { id: barber.id },
            data: {
            password: hashed,
            refreshToken: null,
            },
        });

        return { message: 'Şifre güncellendi' };
    }

    async changePassword(barberId: number, dto: ChangePasswordDto) {
        const barber = await this.prisma.barber.findUnique({ where: { id: barberId } });
        if (!barber) throw new UnauthorizedException('Berber bulunamadı');
        console.log(barber);    
        const ok = await bcrypt.compare(dto.oldPassword, barber.password);
        if (!ok) throw new UnauthorizedException('Şifre yanlış');

        const hashed = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.barber.update({
            where: { id: barber.id },
            data: { password: hashed, refreshToken: null },
        });

        return { message: 'Şifre güncellendi' };
    }

    async pushRegister(barberId: number, dto: { token: string }) {
        const token = dto.token;
        if (!Expo.isExpoPushToken(token)) throw new BadRequestException('Geçersiz anahtar');

        await this.prisma.pushToken.upsert({
            where: { token },
            update: { userId: barberId, role: 'barber', updatedAt: new Date() },
            create: { userId: barberId, role: 'barber', token },
        });

        return { ok: true };
    }
}
