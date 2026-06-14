import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

interface RequestSignupDto {
  email?: string;
  password?: string;
  name?: string;
}

interface VerifyEmailDto {
  email?: string;
  code?: string;
}

interface ResendVerificationDto {
  email?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-signup')
  @HttpCode(HttpStatus.OK)
  async requestSignup(@Body() body: RequestSignupDto) {
    const email = normalizeEmail(body.email);
    const name = body.name?.trim() ?? '';
    const password = body.password ?? '';

    if (!name || !email || password.length < 6) {
      throw new BadRequestException(
        'Name, valid email, and a 6 character password are required.',
      );
    }

    await this.authService.requestSignup(email, password, name);
    return { email, message: 'Verification code sent.' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() body: VerifyEmailDto) {
    const email = normalizeEmail(body.email);
    const code = normalizeCode(body.code);

    if (!email || !code) {
      throw new BadRequestException('Email and verification code are required.');
    }

    const tokens = await this.authService.verifyEmail(email, code);
    return {
      email,
      message: 'Email verified.',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() body: ResendVerificationDto) {
    const email = normalizeEmail(body.email);

    if (!email) {
      throw new BadRequestException('A valid email is required.');
    }

    await this.authService.resendVerification(email);
    return { email, message: 'Verification code sent.' };
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@Headers('authorization') auth: string) {
    const token = extractToken(auth);
    await this.authService.deleteAccount(token);
    return { message: 'Account deleted.' };
  }
}

function extractToken(auth: string): string {
  if (!auth?.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing auth token.');
  }
  return auth.slice(7);
}

function normalizeEmail(email: string | undefined): string {
  const normalized = email?.trim().toLowerCase() ?? '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : '';
}

function normalizeCode(code: string | undefined): string {
  const normalized = code?.trim() ?? '';
  return /^\d{8}$/.test(normalized) ? normalized : '';
}
