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

  async validate(req: any, payload: { sub: number }) {
    const barber = await this.prisma.barber.findUnique({
      where: { id: payload.sub },
    });

    if (!barber || !barber.refreshToken) {
      throw new UnauthorizedException('Refresh token bulunamadı');
    }

    const incomingToken = req.body.refreshToken;

    const isMatch = await bcrypt.compare(incomingToken, barber.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token geçersiz');
    }

    return { id: barber.id, email: barber.email };
  }
}
