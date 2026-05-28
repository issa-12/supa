import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { SupabaseService } from '../supabase/supabase.service';

interface SessionTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async requestSignup(email: string, password: string, name: string): Promise<void> {
    const admin = this.supabase.getAdmin();
    const user = await this.createOrUpdatePendingUser(admin, email, password, name);
    await this.upsertPublicUser(admin, user.id, email, name);
    await this.upsertPublicProfile(admin, user.id, name);
    await this.issueVerificationCode(email);
  }

  async verifyEmail(email: string, code: string): Promise<SessionTokens> {
    const admin = this.supabase.getAdmin();
    const result = await this.verifyAuthOtp(email, code);
    await this.syncVerifiedPublicUser(admin, result.user);
    return {
      accessToken: result.session?.access_token ?? null,
      refreshToken: result.session?.refresh_token ?? null,
    };
  }

  async resendVerification(email: string): Promise<void> {
    // Always returns void — never leaks whether the email is registered.
    // If the email belongs to an already-verified account or doesn't
    // exist at all, we silently no-op so an attacker cannot enumerate
    // accounts by probing this endpoint.
    const admin = this.supabase.getAdmin();

    const existing = await this.findPublicUserByEmail(admin, email);
    if (!existing?.id) return;

    const { data: authUserData, error } = await admin.auth.admin.getUserById(existing.id);
    if (error || !authUserData.user) return;
    if (isAppEmailVerified(authUserData.user)) return;

    await this.issueVerificationCode(email);
  }

  // ── Private helpers ────────────────────────────────────────────

  private async createOrUpdatePendingUser(
    admin: SupabaseClient,
    email: string,
    password: string,
    name: string,
  ): Promise<User> {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, app_email_verified: false },
    });

    if (created.data.user) return created.data.user;

    const existing = await this.findPublicUserByEmail(admin, email);
    if (!existing?.id) {
      throw created.error
        ? new HttpException(created.error.message, HttpStatus.CONFLICT)
        : new ConflictException('Could not create account.');
    }

    const { data: existingAuth, error: existingErr } = await admin.auth.admin.getUserById(existing.id);
    if (existingErr || !existingAuth.user) {
      throw new ConflictException('Could not find existing account.');
    }

    if (isAppEmailVerified(existingAuth.user)) {
      throw new ConflictException(
        'An account with this email already exists. Log in or reset your password.',
      );
    }

    const updated = await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: {
        ...existingAuth.user.user_metadata,
        name,
        app_email_verified: false,
      },
    });

    if (updated.error || !updated.data.user) {
      throw new ConflictException('Could not update pending account.');
    }

    return updated.data.user;
  }

  private async findPublicUserByEmail(
    admin: SupabaseClient,
    email: string,
  ): Promise<{ id: string } | null> {
    const { data, error } = await admin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  private async upsertPublicUser(
    admin: SupabaseClient,
    userId: string,
    email: string,
    name: string,
  ): Promise<void> {
    const { error } = await admin.from('users').upsert(
      { id: userId, email, name, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    );
    if (error) throw new InternalServerErrorException(error.message);
  }

  private async upsertPublicProfile(
    admin: SupabaseClient,
    userId: string,
    name: string,
  ): Promise<void> {
    const { error } = await admin
      .from('profiles')
      .upsert({ user_id: userId, name }, { onConflict: 'user_id' });
    if (error) throw new InternalServerErrorException(error.message);
  }

  private async issueVerificationCode(email: string): Promise<void> {
    const anon = this.supabase.getAnon();
    const { error } = await anon.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) throw new InternalServerErrorException(error.message);
  }

  private async verifyAuthOtp(
    email: string,
    code: string,
  ): Promise<{ user: User; session: Session | null }> {
    const anon = this.supabase.getAnon();

    const magicResult = await anon.auth.verifyOtp({
      email,
      token: code,
      type: 'magiclink',
    });

    if (!magicResult.error && magicResult.data.user) {
      return { user: magicResult.data.user, session: magicResult.data.session };
    }

    const emailResult = await anon.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (emailResult.error) {
      const err = magicResult.error ?? emailResult.error;
      throw new BadRequestException(err.message);
    }

    if (!emailResult.data.user) {
      throw new BadRequestException('Invalid or expired verification code.');
    }

    return { user: emailResult.data.user, session: emailResult.data.session };
  }

  private async syncVerifiedPublicUser(admin: SupabaseClient, user: User): Promise<void> {
    const verified = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, app_email_verified: true },
    });
    if (verified.error) throw new InternalServerErrorException(verified.error.message);

    const email = user.email ?? '';
    const metadataName = user.user_metadata?.['name'];
    const name =
      typeof metadataName === 'string' && metadataName.trim()
        ? metadataName.trim()
        : nameFromEmail(email);

    const { error } = await admin.from('users').upsert(
      { id: user.id, email: email.toLowerCase(), name, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    );
    if (error) throw new InternalServerErrorException(error.message);
  }
}

function isAppEmailVerified(user: User): boolean {
  return user.user_metadata?.['app_email_verified'] === true;
}

function nameFromEmail(email: string): string {
  return email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'ReadTrack Reader';
}
