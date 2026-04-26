import { Injectable } from '@angular/core';
import type {
  AuthResponse,
  AuthTokenResponse,
  OAuthResponse,
  Provider,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

export interface AppUserProfile {
  id: string;
  email: string;
  name: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends AuthCredentials {
  name: string;
}

export interface EmailVerificationRequest {
  email: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private readonly supabaseUrl = 'https://qgoermeodyyfrfoyvnvo.supabase.co';
  private readonly supabaseKey = 'sb_publishable_TIjb7yhm4CGQOcWgybqF8g_Fvq2kxYg';
  private supabaseClientPromise?: Promise<SupabaseClient>;
  private readonly authRedirectPath = '/auth/callback';

  async getBooks() {
    const supabase = await this.getClient();

    return supabase
      .from('books')
      .select('*')
      .then((response) => response.data);
  }

  async signIn({ email, password }: AuthCredentials): Promise<AuthResponse> {
    const supabase = await this.getClient();
    const response = await supabase.auth.signInWithPassword({ email, password });

    if (response.data.user) {
      await this.ensurePublicUser(response.data.user);
    }

    return response;
  }

  async requestEmailVerification(credentials: SignUpCredentials): Promise<void> {
    await this.postAuthApi('/api/auth/request-signup', credentials);
  }

  async verifyEmailCode(request: EmailVerificationRequest): Promise<void> {
    await this.postAuthApi('/api/auth/verify-email', request);
  }

  async resendEmailVerification(email: string): Promise<void> {
    await this.postAuthApi('/api/auth/resend-verification', { email });
  }

  async signInWithProvider(provider: Provider = 'google'): Promise<OAuthResponse> {
    const supabase = await this.getClient();

    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: this.redirectUrl(),
      },
    });
  }

  async sendPasswordReset(email: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: this.redirectUrl(),
    });

    if (error) {
      throw error;
    }
  }

  async exchangeAuthCodeForSession(code: string): Promise<AuthTokenResponse> {
    const supabase = await this.getClient();
    const response = await supabase.auth.exchangeCodeForSession(code);

    if (response.data.user) {
      await this.ensurePublicUser(response.data.user);
    }

    return response;
  }

  async getSession() {
    const supabase = await this.getClient();

    return supabase.auth.getSession();
  }

  async getCurrentSession(): Promise<Session | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return data.session;
  }

  async syncCurrentUser(): Promise<AppUserProfile | null> {
    const supabase = await this.getClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      return null;
    }

    return this.ensurePublicUser(data.user);
  }

  private async ensurePublicUser(user: User): Promise<AppUserProfile> {
    const email = user.email ?? '';
    const metadataName = user.user_metadata?.['name'];
    const name = typeof metadataName === 'string' && metadataName.trim()
      ? metadataName.trim()
      : this.nameFromEmail(email);

    return this.upsertPublicUser({
      id: user.id,
      email,
      name,
    });
  }

  private async upsertPublicUser(profile: AppUserProfile): Promise<AppUserProfile> {
    const supabase = await this.getClient();
    const { error } = await supabase
      .from('users')
      .upsert(profile, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    return profile;
  }

  private nameFromEmail(email: string): string {
    const fallbackName = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();

    return fallbackName || 'ReadTrack Reader';
  }

  private redirectUrl(): string {
    if (typeof window === 'undefined') {
      return this.authRedirectPath;
    }

    return `${window.location.origin}${this.authRedirectPath}`;
  }

  getClient(): Promise<SupabaseClient> {
    this.supabaseClientPromise ??= import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(this.supabaseUrl, this.supabaseKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      }));

    return this.supabaseClientPromise;
  }

  private async postAuthApi(path: string, body: unknown): Promise<void> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.ok) {
        return;
      }

      const payload = await response.json().catch(() => ({ message: 'Authentication request failed.' })) as { message?: string };

      throw new Error(payload.message ?? 'Authentication request failed.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('The auth server did not respond. Check the server console and try again.');
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}
