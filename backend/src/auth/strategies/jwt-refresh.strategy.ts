import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField("refreshToken"),
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(payload: { sub: number }, req: any) {
      const customer = await this.prisma.customer.findUnique({
          where: { id: payload.sub },
      });

      if (!customer || !customer.refreshToken) {
          throw new UnauthorizedException('Refresh token geçersiz');
      }

      const requestToken = req.body.refreshToken;

      const isMatch = await bcrypt.compare(requestToken, customer.refreshToken);
      if (!isMatch) {
          throw new UnauthorizedException('Refresh token uyuşmuyor');
      }

      return { sub: customer.id, role: 'customer' };
  }

}
