import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://qgoermeodyyfrfoyvnvo.supabase.co';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private adminClient: SupabaseClient;
  private anonClient: SupabaseClient;

  onModuleInit() {
    const url = process.env['SUPABASE_URL'] ?? DEFAULT_SUPABASE_URL;
    const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    const anonKey = process.env['SUPABASE_ANON_KEY'];

    if (!serviceRoleKey) {
      throw new ServiceUnavailableException(
        'Auth is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env and restart.',
      );
    }
    if (!anonKey) {
      throw new ServiceUnavailableException(
        'Auth is not configured. Add SUPABASE_ANON_KEY to .env and restart.',
      );
    }

    this.adminClient = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    this.anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  getAdmin(): SupabaseClient {
    return this.adminClient;
  }

  getAnon(): SupabaseClient {
    return this.anonClient;
  }

  // Resolve the user id from a Bearer token AND enforce app-level email
  // verification. A legitimate Supabase JWT is not enough: email/password
  // accounts must have completed the OTP step (user_metadata.app_email_verified
  // === true). OAuth accounts (e.g. Google) are inherently verified by the
  // provider. Returns null when the token is missing/invalid or the email is
  // not verified — callers treat null as 401. This closes the "sign in directly
  // via Supabase and skip OTP" bypass.
  async getVerifiedUserId(token: string | undefined | null): Promise<string | null> {
    if (!token) return null;
    const { data, error } = await this.adminClient.auth.getUser(token);
    if (error || !data.user) return null;

    const u = data.user;
    const appVerified = u.user_metadata?.['app_email_verified'] === true;
    const provider = u.app_metadata?.['provider'];
    const providers = u.app_metadata?.['providers'];
    const isOAuth =
      (typeof provider === 'string' && provider !== 'email') ||
      (Array.isArray(providers) && providers.some((p) => p !== 'email')) ||
      (u.identities ?? []).some((i) => i.provider && i.provider !== 'email');

    if (!appVerified && !isOAuth) return null;
    return u.id;
  }
}
