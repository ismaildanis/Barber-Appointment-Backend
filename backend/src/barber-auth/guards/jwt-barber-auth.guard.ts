import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtBarberGuard extends AuthGuard('jwt-barber'){
    handleRequest(err: any, user: any, _info: any, ctx: ExecutionContext) {
        if (err || !user || user.role !== 'barber') throw err || new UnauthorizedException();
        const req = ctx.switchToHttp().getRequest();
        req.user = user;           // { sub, role, ... }
        req.barber = user;           // { sub, role, ... }
        return user;
    }
}