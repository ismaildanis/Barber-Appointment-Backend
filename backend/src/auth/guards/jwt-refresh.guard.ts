import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        if (err || !user) throw err || new UnauthorizedException();
        const req = context.switchToHttp().getRequest();
        req.user = user;
        req.customer = user; 
        return user;
    }}
