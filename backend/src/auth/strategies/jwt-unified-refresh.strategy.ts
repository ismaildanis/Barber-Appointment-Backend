import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtUnifiedRefreshStrategy extends PassportStrategy(Strategy, 'unified-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: process.env.REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(payload: { sub: number; role: 'customer' | 'barber' | 'admin' }, req: any) {
    const token = req.body.refreshToken;
    if (!token) throw new UnauthorizedException('Refresh token yok');

    if (payload.role === 'customer') {
      const u = await this.prisma.customer.findUnique({ where: { id: payload.sub } });
      if (!u || !u.refreshToken) throw new UnauthorizedException();
      const ok = await bcrypt.compare(token, u.refreshToken);
      if (!ok) throw new UnauthorizedException();
      return { sub: u.id, role: 'customer' };
    }
    if (payload.role === 'barber') {
      const u = await this.prisma.barber.findUnique({ where: { id: payload.sub } });
      if (!u || !u.refreshToken) throw new UnauthorizedException();
      const ok = await bcrypt.compare(token, u.refreshToken);
      if (!ok) throw new UnauthorizedException();
      return { sub: u.id, role: 'barber' };
    }
    if (payload.role === 'admin') {
      const u = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
      if (!u || !u.refreshToken) throw new UnauthorizedException();
      const ok = await bcrypt.compare(token, u.refreshToken);
      if (!ok) throw new UnauthorizedException();
      return { sub: u.id, role: 'admin' };
    }
    throw new UnauthorizedException();
  }
}