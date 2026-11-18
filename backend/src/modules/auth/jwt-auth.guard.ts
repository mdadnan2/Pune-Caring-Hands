import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../common/prisma/prisma.service';

export type AuthenticatedAdmin = { id: string; email: string };
type AuthenticatedRequest = Request & { user?: AuthenticatedAdmin };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) {
      throw unauthorized();
    }

    let payload: { sub?: string; email?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub?: string; email?: string }>(token);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw unauthorized();
    }
    if (!payload.sub || !payload.email) throw unauthorized();

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, isActive: true },
    });
    if (!admin?.isActive || admin.email !== payload.email) throw unauthorized();

    request.user = { id: admin.id, email: admin.email };
    return true;
  }
}

function unauthorized(): UnauthorizedException {
  return new UnauthorizedException({ message: 'Authentication required', code: 'UNAUTHORIZED' });
}
