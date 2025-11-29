import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtBarberStrategy extends PassportStrategy(Strategy, 'jwt-barber') {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET,
        });
    }

    async validate(payload: { sub: number }){
        const barber = await this.prisma.barber.findUnique({where: { id: payload.sub }})
        if(!barber) throw new UnauthorizedException()
        return { id: barber.id, email: barber.email }
    }

}