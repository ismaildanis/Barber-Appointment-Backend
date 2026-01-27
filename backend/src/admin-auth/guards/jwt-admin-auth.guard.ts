import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAdminGuard extends AuthGuard('jwt-admin') {
  handleRequest(err: any, user: any, _info: any, ctx: ExecutionContext) {
    if (err || !user || user.role !== 'admin') throw err || new UnauthorizedException();
    const req = ctx.switchToHttp().getRequest();
    req.user = user; 
    req.admin = user;
    return user;
  }
}