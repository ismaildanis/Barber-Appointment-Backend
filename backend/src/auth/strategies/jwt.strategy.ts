import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

type JwtPayload = { sub: number; role: 'customer' | 'barber' | 'admin'; email?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: number; role: 'customer'; email?: string }) {
    if (payload.role !== 'customer') throw new UnauthorizedException();
    const customer = await this.prisma.customer.findUnique({ where: { id: payload.sub } });
    if (!customer) throw new UnauthorizedException();
    return { sub: customer.id, role: 'customer', email: customer.email };
  }
}
