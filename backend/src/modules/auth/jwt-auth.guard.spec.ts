import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let verifyAsync: jest.Mock;
  let findUnique: jest.Mock;
  let guard: JwtAuthGuard;
  let request: { headers: { authorization?: string }; user?: { id: string; email: string } };

  const context = () =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    verifyAsync = jest.fn();
    findUnique = jest.fn();
    request = { headers: { authorization: 'Bearer test-token' } };
    guard = new JwtAuthGuard(
      { verifyAsync } as unknown as JwtService,
      { admin: { findUnique } } as unknown as PrismaService,
    );
  });

  it('rejects requests without a bearer token', async () => {
    request.headers.authorization = undefined;

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
    expect(verifyAsync).not.toHaveBeenCalled();
  });

  it('rejects inactive admins even with a valid token', async () => {
    verifyAsync.mockResolvedValue({ sub: 'admin-id', email: 'admin@example.com' });
    findUnique.mockResolvedValue({
      id: 'admin-id',
      email: 'admin@example.com',
      isActive: false,
    });

    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('attaches the active admin identity to the request', async () => {
    verifyAsync.mockResolvedValue({ sub: 'admin-id', email: 'admin@example.com' });
    findUnique.mockResolvedValue({
      id: 'admin-id',
      email: 'admin@example.com',
      isActive: true,
    });

    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'admin-id', email: 'admin@example.com' });
  });

  it('does not mask database failures as authentication failures', async () => {
    verifyAsync.mockResolvedValue({ sub: 'admin-id', email: 'admin@example.com' });
    const databaseError = new Error('database unavailable');
    findUnique.mockRejectedValue(databaseError);

    await expect(guard.canActivate(context())).rejects.toBe(databaseError);
  });
});
