import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAdminRefreshGuard extends AuthGuard('jwt-admin-refresh') {
  handleRequest(err: any, user: any, _info: any, ctx: ExecutionContext) {
    if (err || !user) throw err || new UnauthorizedException();
    const req = ctx.switchToHttp().getRequest();
    req.user = user;
    req.admin = user;
    return user;
  }
}