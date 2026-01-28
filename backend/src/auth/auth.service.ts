import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Expo } from 'expo-server-sdk';
const expo = new Expo();
import { Resend } from 'resend';
@Injectable()
export class AuthService 
{
    private resend: Resend;
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) {
        this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    async register(dto: RegisterDto)
    {
        const email = dto.email;    
        const exists =
            (await this.prisma.customer.findUnique({ where: { email } })) ||
            (await this.prisma.barber.findUnique({ where: { email } })) ||
            (await this.prisma.admin.findUnique({ where: { email } }));

        if (exists) throw new ConflictException('Bu email kullanılıyor başka bir email deneyin.');

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
            role: "customer",
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
            role: "customer",
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

        await this.prisma.pushToken.deleteMany({
            where: { 
                userId: customerId,
                role: "customer"
            }
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

        const accessToken = await this.jwt.signAsync(
            { sub: customerId, role: "customer" },
            {
                secret: process.env.JWT_SECRET,
                expiresIn: process.env.JWT_EXPIRES_IN,
            }
        );
        const newRefreshToken = await this.jwt.signAsync(
            { sub: customerId, role: "customer" },
            {
                secret: process.env.REFRESH_SECRET,
                expiresIn: process.env.REFRESH_EXPIRES_IN,
            },
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
            {sub: customerId, email, role: "customer"},
            {
                secret: process.env.JWT_SECRET!,
                expiresIn: process.env.JWT_EXPIRES_IN!,
            }
        )

        const refreshToken = await this.jwt.signAsync(
            { sub: customerId, email, role: "customer"}, 
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
        const customer = await this.prisma.customer.findUnique({ where: { email: dto.email }});
        if (!customer) return null;

        const ok = await bcrypt.compare(dto.password, customer.password);
        if (!ok) return null;

        const { accessToken, refreshToken } = await this.generateTokens(customer.id, customer.email);
        await this.prisma.customer.update({
            where: { id: customer.id },
            data: { refreshToken: await bcrypt.hash(refreshToken, 12) },
        });

        return {
            message: "Giriş başarılı",
            role: "customer" as const,
            userId: customer.id,
            accessToken,
            refreshToken,
            user: {
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone: customer.phone,
            },
        };
    }

    async forgot(dto: { email: string }) {
        const customer = await this.prisma.customer.findUnique({ where: { email: dto.email } });
        if (!customer) return { message: 'Reset kodu gönderildi' };

        const code = randomInt(0, 1_000_000).toString().padStart(6, '0') 

        const tokenHash = await bcrypt.hash(code, 12);
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        await this.prisma.passwordReset.create({
            data: { email: dto.email, tokenHash: tokenHash, expiresAt },
        });
        
        try {
            await this.resend.emails.send({
                from: 'SALON BARBER <onboarding@resend.dev>',
                to: dto.email,
                subject: 'Şifre sıfırlama kodu',
                html: `<p>Kodunuz: <b>${code}</b> (30 dk geçerli)</p>`,
            });
        } catch (error) {
            console.error('Resend error:', error);
        }

        return { message: "Sıfırlama kodu e-posta ile gönderildi"}
    }

    async verifyReset(dto: { email: string; code: string }) {
        const passwordReset = await this.prisma.passwordReset.findFirst({
            where: { email: dto.email, usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
        });
        if (!passwordReset) throw new UnauthorizedException('Sıfırlama kodu geçersiz');

        const ok = await bcrypt.compare(dto.code, passwordReset.tokenHash);
        if (!ok) throw new UnauthorizedException('Sıfırlama kodu yanlış');

        const resetSessionId = await this.jwt.signAsync(
            { email: dto.email, role: 'customer', purpose: 'password-reset' },
            { secret: process.env.RESET_SECRET, expiresIn: '15m' },
        );

        await this.prisma.passwordReset.update({
            where: { id: passwordReset.id },
            data: { usedAt: new Date() },
        });

        return { resetSessionId, role: 'customer' };
    }

    async resetPassword(email: string, newPassword: string) {
        const customer = await this.prisma.customer.findUnique({ where: { email } });
        if (!customer) return { message: 'Şifre güncellendi' };

        const hashed = await bcrypt.hash(newPassword, 12);
        await this.prisma.customer.update({
            where: { id: customer.id },
            data: {
            password: hashed,
            refreshToken: null,
            },
        });

        return { message: 'Şifre güncellendi' };
    }

    async changePassword(customerId: number, dto: ChangePasswordDto) {
        const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
        if (!customer) throw new UnauthorizedException('Kullanıcı bulunamadı');

        const ok = await bcrypt.compare(dto.oldPassword, customer.password);
        if (!ok) throw new UnauthorizedException('Şifre yanlış. Tekrar Deneyiniz');

        const hashed = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.customer.update({
            where: { id: customer.id },
            data: { password: hashed, refreshToken: null },
        });

        return { message: 'Şifre güncellendi' };
    }

    async pushRegister(customerId: number, dto: { token: string }) {
        const token = dto.token;
        if (!Expo.isExpoPushToken(token)) {
            throw new BadRequestException('Geçersiz anahtar');
        }

        await this.prisma.pushToken.upsert({
            where: {
                userId_role: {
                    userId: customerId,
                    role: 'customer',
                },
            },
            update: {
                token,
                updatedAt: new Date(),
            },
            create: {
                userId: customerId,
                role: 'customer',
                token,
            },
        });

        return { ok: true };
    }

}
