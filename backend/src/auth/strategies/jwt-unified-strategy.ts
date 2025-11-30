import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtUnifiedStrategy extends PassportStrategy(Strategy, 'unified-jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: number; role: 'customer'|'barber'|'admin'; email?: string }) {
    if (payload.role === 'customer') {
      const u = await this.prisma.customer.findUnique({ where: { id: payload.sub } });
      if (!u) throw new UnauthorizedException();
      return { sub: u.id, role: 'customer', email: u.email };
    }
    if (payload.role === 'barber') {
      const u = await this.prisma.barber.findUnique({ where: { id: payload.sub } });
      if (!u) throw new UnauthorizedException();
      return { sub: u.id, role: 'barber', email: u.email };
    }
    if (payload.role === 'admin') {
      const u = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
      if (!u) throw new UnauthorizedException();
      return { sub: u.id, role: 'admin', email: u.email };
    }
    throw new UnauthorizedException();
  }
}
