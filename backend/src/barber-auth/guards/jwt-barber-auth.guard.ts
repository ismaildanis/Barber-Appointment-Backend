import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtBarberGuard extends AuthGuard('jwt-barber'){
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if(err || !user) throw err || new UnauthorizedException();
        context.switchToHttp().getRequest().barber = user;
        return user;
    }
}