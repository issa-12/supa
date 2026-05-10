import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

loadEnvFile('.env');
loadEnvFile('.env.local');

const serverDistFolder = fileURLToPath(new URL('.', import.meta.url));
const browserDistFolder = join(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const defaultSupabaseUrl = 'https://qgoermeodyyfrfoyvnvo.supabase.co';

interface RequestSignupBody {
  email?: string;
  password?: string;
  name?: string;
}

interface VerifyEmailBody {
  email?: string;
  code?: string;
}

app.use(express.json({ limit: '16kb' }));

app.post('/api/auth/request-signup', async (req, res) => {
  try {
    const body = req.body as RequestSignupBody;
    const email = normalizeEmail(body.email);
    const name = body.name?.trim() ?? '';
    const password = body.password ?? '';

    if (!name || !email || password.length < 6) {
      res.status(400).json({ message: 'Name, valid email, and a 6 character password are required.' });
      return;
    }

    const supabase = await getSupabaseAdminClient();
    const user = await createOrUpdatePendingUser(supabase, email, password, name);
    await upsertPublicUser(supabase, user.id, email, name);
    await upsertPublicProfile(supabase, user.id, name);
    await issueVerificationCode(email);

    res.status(200).json({
      email,
      message: 'Verification code sent.',
    });
  } catch (error) {
    const { status, message } = authApiError(error);
    res.status(status).json({ message });
  }
});

app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const body = req.body as VerifyEmailBody;
    const email = normalizeEmail(body.email);
    const code = normalizeCode(body.code);

    if (!email || !code) {
      res.status(400).json({ message: 'Email and verification code are required.' });
      return;
    }

    const supabase = await getSupabaseAdminClient();
    const verification = await verifyAuthOtp(email, code);

    await syncVerifiedPublicUser(supabase, verification.user);

    res.status(200).json({
      email,
      message: 'Email verified.',
      access_token: verification.session?.access_token ?? null,
      refresh_token: verification.session?.refresh_token ?? null,
    });
  } catch (error) {
    const { status, message } = authApiError(error);
    res.status(status).json({ message });
  }
});

app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const body = req.body as Pick<RequestSignupBody, 'email'>;
    const email = normalizeEmail(body.email);

    if (!email) {
      res.status(400).json({ message: 'A valid email is required.' });
      return;
    }

    const supabase = await getSupabaseAdminClient();
    const existing = await findPublicUserByEmail(supabase, email);

    if (!existing?.id) {
      throw new HttpError(404, 'No pending account was found for this email.');
    }

    const authUser = await supabase.auth.admin.getUserById(existing.id);

    if (authUser.error || !authUser.data.user) {
      throw authUser.error ?? new HttpError(404, 'No pending account was found for this email.');
    }

    if (isAppEmailVerified(authUser.data.user)) {
      throw new HttpError(409, 'This email is already verified. You can log in.');
    }

    await issueVerificationCode(email);

    res.status(200).json({
      email,
      message: 'Verification code sent.',
    });
  } catch (error) {
    const { status, message } = authApiError(error);
    res.status(status).json({ message });
  }
});

// ── Google Books search proxy ─────────────────────────────────
app.get('/api/books/search', async (req, res) => {
  try {
    const q = ((req.query['q'] as string) ?? '').trim();

    if (!q || q.length < 2) {
      res.status(400).json({ message: 'Query must be at least 2 characters.' });
      return;
    }

    const maxResults = Math.min(Number(req.query['maxResults']) || 20, 40);
    const startIndex = Number(req.query['startIndex']) || 0;

    const params = new URLSearchParams({
      q,
      maxResults: String(maxResults),
      startIndex: String(startIndex),
      printType: 'books',
    });

    const apiKey = process.env['GOOGLE_BOOKS_API_KEY'];
    if (apiKey) params.set('key', apiKey);

    const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);

    if (!googleRes.ok) {
      res.status(502).json({ message: 'Book search service unavailable.' });
      return;
    }

    const data = (await googleRes.json()) as GoogleBooksApiResponse;
    const books = (data.items ?? []).map(mapGoogleBookItem);

    res.status(200).json({ books, totalItems: data.totalItems ?? 0 });
  } catch {
    res.status(500).json({ message: 'Book search failed.' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
    console.log(`Supabase service role configured: ${Boolean(process.env['SUPABASE_SERVICE_ROLE_KEY'])}`);
    console.log(`Supabase anon key configured: ${Boolean(process.env['SUPABASE_ANON_KEY'])}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

async function getSupabaseAdminClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env['SUPABASE_URL'] ?? defaultSupabaseUrl;
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!serviceRoleKey) {
    throw new HttpError(503, 'Auth is not configured. Add SUPABASE_SERVICE_ROLE_KEY to .env and restart npm start.');
  }

  const { createClient } = await import('@supabase/supabase-js');

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function getSupabaseAuthClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env['SUPABASE_URL'] ?? defaultSupabaseUrl;
  const anonKey = process.env['SUPABASE_ANON_KEY'];

  if (!anonKey) {
    throw new HttpError(503, 'Auth is not configured. Add SUPABASE_ANON_KEY to .env and restart npm start.');
  }

  const { createClient } = await import('@supabase/supabase-js');

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function createOrUpdatePendingUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  name: string,
): Promise<User> {
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      app_email_verified: false,
    },
  });

  if (created.data.user) {
    return created.data.user;
  }

  const existing = await findPublicUserByEmail(supabase, email);

  if (!existing?.id) {
    throw created.error ?? new HttpError(409, 'Could not create account.');
  }

  const existingAuthUser = await supabase.auth.admin.getUserById(existing.id);

  if (existingAuthUser.error || !existingAuthUser.data.user) {
    throw existingAuthUser.error ?? new HttpError(409, 'Could not find existing account.');
  }

  if (isAppEmailVerified(existingAuthUser.data.user)) {
    throw new HttpError(409, 'An account with this email already exists. Log in or reset your password.');
  }

  const updated = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    user_metadata: {
      ...existingAuthUser.data.user.user_metadata,
      name,
      app_email_verified: false,
    },
  });

  if (updated.error || !updated.data.user) {
    throw updated.error ?? new HttpError(409, 'Could not update pending account.');
  }

  return updated.data.user;
}

async function findPublicUserByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function upsertPublicUser(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email,
      name,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

async function upsertPublicProfile(
  supabase: SupabaseClient,
  userId: string,
  name: string,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      name,
    }, { onConflict: 'user_id' });

  if (error) {
    throw error;
  }
}

async function issueVerificationCode(email: string): Promise<void> {
  const supabase = await getSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    throw error;
  }
}

async function verifyAuthOtp(
  email: string,
  code: string,
): Promise<{ user: User; session: Session | null }> {
  const supabase = await getSupabaseAuthClient();

  const magicLinkResult = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'magiclink',
  });

  if (!magicLinkResult.error && magicLinkResult.data.user) {
    return {
      user: magicLinkResult.data.user,
      session: magicLinkResult.data.session,
    };
  }

  const emailOtpResult = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'email',
  });

  if (emailOtpResult.error) {
    throw magicLinkResult.error ?? emailOtpResult.error;
  }

  if (!emailOtpResult.data.user) {
    throw new HttpError(400, 'Invalid or expired verification code.');
  }

  return {
    user: emailOtpResult.data.user,
    session: emailOtpResult.data.session,
  };
}

async function syncVerifiedPublicUser(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const verified = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      app_email_verified: true,
    },
  });

  if (verified.error) {
    throw verified.error;
  }

  const email = user.email;
  const metadataName = user.user_metadata?.['name'];
  const name = typeof metadataName === 'string' && metadataName.trim()
    ? metadataName.trim()
    : nameFromEmail(email ?? '');

  const upserted = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: email?.toLowerCase() ?? '',
      name,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (upserted.error) {
    throw upserted.error;
  }
}

function normalizeEmail(email: string | undefined): string {
  const normalized = email?.trim().toLowerCase() ?? '';

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : '';
}

function normalizeCode(code: string | undefined): string {
  const normalized = code?.trim() ?? '';

  return /^\d{8}$/.test(normalized) ? normalized : '';
}

function isAppEmailVerified(user: User): boolean {
  return user.user_metadata?.['app_email_verified'] === true;
}

function nameFromEmail(email: string): string {
  return email.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || 'ReadTrack Reader';
}

function authApiError(error: unknown): { status: number; message: string } {
  if (error instanceof HttpError) {
    return { status: error.status, message: error.message };
  }

  if (hasErrorMessage(error)) {
    if (/email_verification_codes/i.test(error.message)) {
      return {
        status: 503,
        message: 'Verification storage is not configured. Run supabase-auth-setup.sql in Supabase.',
      };
    }

    const duplicate = /already|registered|duplicate/i.test(error.message);
    return {
      status: duplicate ? 409 : 500,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    if (/email_verification_codes/i.test(error.message)) {
      return {
        status: 503,
        message: 'Verification storage is not configured. Run supabase-auth-setup.sql in Supabase.',
      };
    }

    const duplicate = /already|registered|duplicate/i.test(error.message);
    return {
      status: duplicate ? 409 : 500,
      message: error.message,
    };
  }

  return { status: 500, message: 'Authentication request failed.' };
}

function hasErrorMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string';
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

// ── Google Books types ────────────────────────────────────────
interface GoogleBooksApiResponse {
  totalItems?: number;
  items?: GoogleBookItem[];
}

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
  };
}

export interface SearchedBook {
  googleId: string;
  title: string;
  author: string;
  description: string | null;
  publishedDate: string | null;
  coverUrl: string | null;
  pageCount: number | null;
  categories: string[];
}

function mapGoogleBookItem(item: GoogleBookItem): SearchedBook {
  const v = item.volumeInfo;
  const thumbnail = v.imageLinks?.thumbnail ?? null;
  return {
    googleId: item.id,
    title: v.title ?? 'Unknown Title',
    author: (v.authors ?? []).join(', ') || 'Unknown Author',
    description: v.description ?? null,
    publishedDate: v.publishedDate ?? null,
    coverUrl: thumbnail ? thumbnail.replace('http://', 'https://') : null,
    pageCount: v.pageCount ?? null,
    categories: v.categories ?? [],
  };
}

function loadEnvFile(filename: string): void {
  const filePath = resolve(process.cwd(), filename);

  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}
