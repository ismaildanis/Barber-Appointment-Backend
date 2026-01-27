import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtUnifiedRefreshGuard extends AuthGuard('unified-refresh') {
  handleRequest(err: any, user: any, _info: any, ctx: ExecutionContext) {
    if (err || !user) throw err || new UnauthorizedException();
    ctx.switchToHttp().getRequest().user = user; // { sub, role }
    return user;
  }
}
