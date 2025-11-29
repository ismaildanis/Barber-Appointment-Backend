import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtBarberRefreshGuard extends AuthGuard('jwt-barber-refresh') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) throw err || new UnauthorizedException();
    const req = context.switchToHttp().getRequest();
    req.user = user;
    req.barber = user;
    return user;
  }
}
