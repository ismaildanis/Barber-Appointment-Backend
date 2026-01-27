import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, _info: any, ctx: ExecutionContext) {
    if (err || !user || user.role !== 'customer') throw err || new UnauthorizedException();
    const req = ctx.switchToHttp().getRequest();
    req.user = user;          
    req.customer = user;       
    return user;
  }
}