import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtAdminRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-admin-refresh'
) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.adminRefreshToken || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: { sub: number }) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || !admin.refreshToken) {
      throw new UnauthorizedException('Refresh token bulunamadı');
    }

    const incomingToken = req.cookies.adminRefreshToken;
    const isMatch = await bcrypt.compare(incomingToken, admin.refreshToken);

    if (!isMatch) {
      throw new UnauthorizedException('Refresh token geçersiz');
    }

    return { id: admin.id };
  }
}
