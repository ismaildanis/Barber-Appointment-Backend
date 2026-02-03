import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtAdminRefreshStrategy extends PassportStrategy(Strategy, 'jwt-admin-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(payload: { sub: number; role?: string }, req: any) {
    const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.refreshToken) throw new UnauthorizedException('Refresh token geçersiz');

    const requestToken = req.body.refreshToken;
    const isMatch = await bcrypt.compare(requestToken, admin.refreshToken);
    if (!isMatch) throw new UnauthorizedException('Refresh token uyuşmuyor');

    return { sub: admin.id, role: 'admin', shopId: admin.shopId };
  }
}
