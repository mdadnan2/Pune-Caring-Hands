import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    const passwordMatches = admin ? await bcrypt.compare(dto.password, admin.passwordHash) : false;

    if (!admin || !admin.isActive || !passwordMatches) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const accessToken = await this.jwt.signAsync(
      { sub: admin.id, email: admin.email },
      { expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '8h' },
    );

    return {
      accessToken,
      admin: { id: admin.id, name: admin.name, email: admin.email },
    };
  }
}
