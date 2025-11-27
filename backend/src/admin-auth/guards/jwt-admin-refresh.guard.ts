import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtAdminRefreshGuard extends AuthGuard('jwt-admin-refresh') {
  handleRequest(err: any, user: any, info: any, ctx: ExecutionContext) {
    if (err || !user) throw err || new UnauthorizedException();
    const req = ctx.switchToHttp().getRequest();
    req.admin = user;
    return user;
  }
}
