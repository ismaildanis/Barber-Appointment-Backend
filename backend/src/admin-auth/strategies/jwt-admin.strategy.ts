import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'jwt-admin') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.adminAccessToken || null,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      
    });
  }

  async validate(payload: { sub: number }) {
    const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
    if (!admin) throw new UnauthorizedException();
    return { id: admin.id, email: admin.email };
  }
}
