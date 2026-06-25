import { Injectable, inject } from '@angular/core';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type {
  AuthResponse,
  AuthTokenResponse,
  OAuthResponse,
  Provider,
  RealtimeChannel,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { APP_COPY, TranslationService } from '../../i18n';

export type RealtimeStatus = 'connecting' | 'live' | 'offline';

export interface RealtimeSubscriptionOptions {
  /** public-schema tables to watch (a single channel can watch several). */
  tables: string[];
  /** Row event to listen for. Defaults to all events. */
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  /** Optional PostgREST-style row filter, e.g. `post_id=eq.42`. Applied to every table. */
  filter?: string;
  /** Fired on each matching row change. */
  onChange: () => void;
  /**
   * Fired whenever the channel RE-subscribes after a dropped connection (not on
   * the first subscribe). Use it to re-sync state that may have changed while
   * the socket was down — realtime delivers no backlog for the gap.
   */
  onReconnect?: () => void;
  /** Fired on each lifecycle transition, for an optional UI indicator. */
  onStatus?: (status: RealtimeStatus) => void;
}

export interface RealtimeSubscription {
  /** Removes the channel and stops the socket from holding it open. */
  teardown: () => Promise<void>;
}

// Supabase serializes auth-token access with the browser's Navigator LockManager
// by default. When concurrent getUser/getSession calls race on load it logs
// "Acquiring an exclusive Navigator LockManager lock … immediately failed".
// This in-memory lock serializes those calls through a promise chain instead —
// no navigator.locks call, so no console noise (single client per tab, which is
// what we have, makes this sufficient).
let authLockChain: Promise<unknown> = Promise.resolve();
function inMemoryAuthLock<R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
  const run = authLockChain.then(() => fn(), () => fn());
  authLockChain = run.then(() => undefined, () => undefined);
  return run;
}

// Carries the backend's stable error `code` (e.g. EMAIL_EXISTS, WEAK_PASSWORD)
// so the UI can map it to a localized message instead of showing a raw string.
export class AuthApiError extends Error {
  constructor(
    readonly code: string | null,
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

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
  private readonly translationService = inject(TranslationService);
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
      if (response.data.user.user_metadata?.['app_email_verified'] === false) {
        await supabase.auth.signOut();

        return {
          data: {
            user: null,
            session: null,
          },
          error: {
            name: 'EmailNotVerifiedError',
            message: 'Please verify your email before logging in.',
          },
        } as AuthResponse;
      }

      await this.ensurePublicUser(response.data.user);
    }

    return response;
  }

  async requestEmailVerification(credentials: SignUpCredentials): Promise<void> {
    await this.postAuthApi<unknown>('/api/auth/request-signup', credentials);
  }

  async verifyEmailCode(request: EmailVerificationRequest): Promise<void> {
    const data = await this.postAuthApi<{ access_token?: string; refresh_token?: string }>(
      '/api/auth/verify-email',
      request,
    );

    if (data.access_token && data.refresh_token) {
      const supabase = await this.getClient();
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
    }
  }

  async resendEmailVerification(email: string): Promise<void> {
    await this.postAuthApi<unknown>('/api/auth/resend-verification', { email });
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

  async sendPasswordResetViaFunction(email: string): Promise<void> {
    const supabase = await this.getClient();
    const { error } = await supabase.functions.invoke('send-password-reset-email', {
      body: {
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      },
    });

    if (error) {
      // The function returns a non-2xx status when no account exists for the
      // email (it can't issue an OTP for an unknown user). Surfacing that would
      // both confuse the user ("Edge function returned a non-2xx status code")
      // and leak which emails are registered (account enumeration). Swallow the
      // HTTP error so the caller shows the same neutral "if an account exists…"
      // message; only re-throw genuine transport failures (function down).
      if (error instanceof FunctionsHttpError) return;
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
    // Reaching here means an authenticated session (password login blocks
    // unverified accounts; OAuth accounts are inherently verified), so mark
    // the public.users row verified — this also self-heals the flag.
    const { error } = await supabase
      .from('users')
      .upsert({ ...profile, verified: true }, { onConflict: 'id' });

    if (error) {
      throw error;
    }

    return profile;
  }

  private nameFromEmail(email: string): string {
    const fallbackName = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();

    return (
      fallbackName ||
      APP_COPY[this.translationService.getCurrentLanguage()].defaultReader
    );
  }

  private redirectUrl(): string {
    if (typeof window === 'undefined') {
      return this.authRedirectPath;
    }

    return `${window.location.origin}${this.authRedirectPath}`;
  }

  /**
   * Subscribe to Postgres changes with built-in connection-lifecycle handling.
   *
   * Supabase's realtime socket auto-reconnects and re-joins channels after a
   * drop (network blip, laptop sleep, token refresh), but it replays no events
   * for the offline gap. This helper surfaces that: `onStatus` reports the live
   * state, and `onReconnect` fires on every re-subscribe so the caller can
   * re-fetch whatever it may have missed. Returns an async teardown.
   */
  async createRealtimeSubscription(
    name: string,
    opts: RealtimeSubscriptionOptions,
  ): Promise<RealtimeSubscription> {
    const client = await this.getClient();
    const event = opts.event ?? '*';
    let channel: RealtimeChannel = client.channel(`${name}-${crypto.randomUUID()}`);

    for (const table of opts.tables) {
      const config = { event, schema: 'public', table, ...(opts.filter ? { filter: opts.filter } : {}) };
      // The supabase-js postgres_changes overload is awkward to satisfy when the
      // event is a variable; the runtime shape is correct.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      channel = channel.on('postgres_changes', config as any, () => opts.onChange());
    }

    let hasSubscribed = false;
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        opts.onStatus?.('live');
        if (hasSubscribed) opts.onReconnect?.();
        hasSubscribed = true;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        opts.onStatus?.('offline');
      } else {
        opts.onStatus?.('connecting');
      }
    });

    return {
      teardown: async () => {
        await client.removeChannel(channel);
      },
    };
  }

  getClient(): Promise<SupabaseClient> {
    this.supabaseClientPromise ??= import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(this.supabaseUrl, this.supabaseKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
          lock: inMemoryAuthLock,
        },
      }));

    return this.supabaseClientPromise;
  }

  private async postAuthApi<T>(path: string, body: unknown): Promise<T> {
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

      const payload = await response.json().catch(() => ({ message: 'Authentication request failed.' })) as T & { message?: string; code?: string };

      if (response.ok) {
        return payload;
      }

      throw new AuthApiError(
        payload.code ?? null,
        payload.message ?? 'Authentication request failed.',
        response.status,
      );
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
