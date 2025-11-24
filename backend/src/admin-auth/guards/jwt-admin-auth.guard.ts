import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAdminGuard extends AuthGuard('jwt-admin') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) throw err || new UnauthorizedException();
    context.switchToHttp().getRequest().admin = user;
    return user;
  }
}
