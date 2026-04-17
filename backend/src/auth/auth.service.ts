import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RegisterDto, LoginDto } from './dto';

interface GoogleUserProfile {
  id: string;
  email?: string;
  full_name?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check if phone already exists
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new ConflictException('Phone number already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(dto.password, salt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password_hash,
        full_name: dto.full_name,
        phone: dto.phone,
        role: dto.role || 'CUSTOMER',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async googleLogin(profile: GoogleUserProfile) {
    if (!profile.email) {
      throw new UnauthorizedException('Google account email is required');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      const password_hash = await bcrypt.hash(randomUUID(), 10);
      const phone = await this.generateGooglePhone(profile.id);

      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          password_hash,
          full_name: profile.full_name || profile.email.split('@')[0],
          phone,
          role: 'CUSTOMER',
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const isRevoked = await this.redisService.get(
      this.getRefreshTokenBlacklistKey(refreshToken),
    );
    if (isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(
        user.id,
        user.email,
        user.role,
      );

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const expiresAt = Number(payload.exp || 0);
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const ttl = Math.max(expiresAt - nowInSeconds, 0);

      if (ttl > 0) {
        await this.redisService.set(
          this.getRefreshTokenBlacklistKey(refreshToken),
          '1',
          ttl,
        );
      }

      return { message: 'Logged out successfully' };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
  ) {
    const payload = { sub: userId, email, role };

    const accessExpiration = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION',
      '15m',
    );
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiration as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiration as any,
      }),
    ]);

    return { access_token, refresh_token };
  }

  private getRefreshTokenBlacklistKey(refreshToken: string) {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    return `auth:blacklist:refresh:${tokenHash}`;
  }

  private toPublicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
    };
  }

  private async generateGooglePhone(googleId: string) {
    const basePhone = `google-${googleId}`;
    let phone = basePhone;
    let suffix = 0;

    while (await this.prisma.user.findUnique({ where: { phone } })) {
      suffix += 1;
      phone = `${basePhone}-${suffix}`;
    }

    return phone;
  }
}
