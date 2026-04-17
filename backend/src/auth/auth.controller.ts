import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto } from './dto';
import { GoogleAuthGuard } from './guards';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto.refresh_token);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @Req()
    req: {
      user?: {
        id: string;
        email?: string;
        full_name?: string;
      };
    },
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3001',
    );

    try {
      if (!req.user) {
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      const authResult = await this.authService.googleLogin(req.user);
      const params = new URLSearchParams({
        access_token: authResult.access_token,
        refresh_token: authResult.refresh_token,
        user: JSON.stringify(authResult.user),
      });

      return res.redirect(`${frontendUrl}/auth/google/callback?${params.toString()}`);
    } catch {
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }
}
