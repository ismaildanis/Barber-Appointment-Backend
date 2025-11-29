import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtBarberRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-barber-refresh',
) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(payload: { sub: number; role?: string }, req: any) {
    const barber = await this.prisma.barber.findUnique({ where: { id: payload.sub } });
    if (!barber || !barber.refreshToken) throw new UnauthorizedException('Refresh token geçersiz');

    const requestToken = req.body.refreshToken;
    const isMatch = await bcrypt.compare(requestToken, barber.refreshToken);
    if (!isMatch) throw new UnauthorizedException('Refresh token uyuşmuyor');

    return { sub: barber.id, role: 'barber' };
  }
}
