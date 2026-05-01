import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { createHash, randomInt } from 'node:crypto';
import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import type { SupabaseClient, User } from '@supabase/supabase-js';

loadEnvFile('.env');
loadEnvFile('.env.local');

const serverDistFolder = fileURLToPath(new URL('.', import.meta.url));
const browserDistFolder = join(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();
const codeTtlMinutes = 10;

interface RequestSignupBody {
  email?: string;
  password?: string;
  name?: string;
}

interface VerifyEmailBody {
  email?: string;
  code?: string;
}

interface EmailVerificationMetadata {
  email: string;
  code_hash: string;
  expires_at: string;
  attempts: number;
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

    ensureVerificationDeliveryConfigured();

    const supabase = await getSupabaseAdminClient();
    const user = await createOrUpdatePendingUser(supabase, email, password, name);
    await upsertPublicUser(supabase, user.id, email, name);
    await issueVerificationCode(supabase, user, email);

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
    const verification = await findValidVerificationCode(supabase, email, code);

    await markVerificationCodeConsumed(supabase, verification.userId);
    await confirmSupabaseUser(supabase, verification.userId);

    res.status(200).json({
      email,
      message: 'Email verified.',
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

    ensureVerificationDeliveryConfigured();

    const supabase = await getSupabaseAdminClient();
    const existing = await findPublicUserByEmail(supabase, email);

    if (!existing?.id) {
      throw new HttpError(404, 'No pending account was found for this email.');
    }

    const authUser = await supabase.auth.admin.getUserById(existing.id);

    if (authUser.error || !authUser.data.user) {
      throw authUser.error ?? new HttpError(404, 'No pending account was found for this email.');
    }

    if (authUser.data.user.email_confirmed_at) {
      throw new HttpError(409, 'This email is already verified. You can log in.');
    }

    await issueVerificationCode(supabase, authUser.data.user, email);

    res.status(200).json({
      email,
      message: 'Verification code sent.',
    });
  } catch (error) {
    const { status, message } = authApiError(error);
    res.status(status).json({ message });
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
    console.log(`Email delivery configured: ${Boolean(process.env['RESEND_API_KEY'] && process.env['EMAIL_FROM']) || process.env['EMAIL_DEBUG_LOG_CODES'] === 'true'}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

async function getSupabaseAdminClient(): Promise<SupabaseClient> {
  const supabaseUrl = process.env['SUPABASE_URL'] ?? 'https://qgoermeodyyfrfoyvnvo.supabase.co';
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

async function createOrUpdatePendingUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  name: string,
): Promise<User> {
  const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
    user_metadata: {
      name,
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

  if (existingAuthUser.data.user.email_confirmed_at) {
    throw new HttpError(409, 'An account with this email already exists. Log in or reset your password.');
  }

  const updated = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    user_metadata: {
      name,
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

async function issueVerificationCode(
  supabase: SupabaseClient,
  user: User,
  email: string,
): Promise<void> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + codeTtlMinutes * 60_000).toISOString();
  const codeHash = hashVerificationCode(email, code);

  const updated = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      email_verification: {
        email,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
      },
    },
  });

  if (updated.error) {
    throw updated.error;
  }

  await sendVerificationEmail(email, code);
}

async function sendVerificationEmail(email: string, code: string): Promise<void> {
  if (shouldLogVerificationCodes()) {
    console.log(`ReadTrack verification code for ${email}: ${code}`);
    return;
  }

  const resendApiKey = process.env['RESEND_API_KEY'];
  const emailFrom = process.env['EMAIL_FROM'];

  if (!resendApiKey || !emailFrom) {
    throw new HttpError(503, 'Email is not configured. Add RESEND_API_KEY and EMAIL_FROM to .env, or set EMAIL_DEBUG_LOG_CODES=true for local testing.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFrom,
      to: email,
      subject: 'Your ReadTrack verification code',
      text: `Your ReadTrack verification code is ${code}. It expires in ${codeTtlMinutes} minutes.`,
      html: `<p>Your ReadTrack verification code is <strong>${code}</strong>.</p><p>It expires in ${codeTtlMinutes} minutes.</p>`,
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, 'Could not send verification email.');
  }
}

function ensureVerificationDeliveryConfigured(): void {
  if (shouldLogVerificationCodes()) {
    return;
  }

  if (process.env['RESEND_API_KEY'] && process.env['EMAIL_FROM']) {
    return;
  }

  throw new HttpError(503, 'Email is not configured. Add RESEND_API_KEY and EMAIL_FROM to .env, or set EMAIL_DEBUG_LOG_CODES=true for local testing.');
}

function shouldLogVerificationCodes(): boolean {
  return process.env['EMAIL_DEBUG_LOG_CODES'] === 'true';
}

async function findValidVerificationCode(
  supabase: SupabaseClient,
  email: string,
  code: string,
): Promise<{ userId: string; attempts: number }> {
  const publicUser = await findPublicUserByEmail(supabase, email);

  if (!publicUser?.id) {
    throw new HttpError(400, 'Invalid or expired verification code.');
  }

  const authUser = await supabase.auth.admin.getUserById(publicUser.id);

  if (authUser.error || !authUser.data.user) {
    throw authUser.error ?? new HttpError(400, 'Invalid or expired verification code.');
  }

  const verification = readEmailVerificationMetadata(authUser.data.user);
  const codeHash = hashVerificationCode(email, code);

  if (
    !verification ||
    verification.email !== email ||
    verification.code_hash !== codeHash ||
    new Date(verification.expires_at).getTime() <= Date.now()
  ) {
    await recordFailedVerificationAttempt(supabase, authUser.data.user);
    throw new HttpError(400, 'Invalid or expired verification code.');
  }

  if (verification.attempts >= 5) {
    throw new HttpError(429, 'Too many attempts. Request a new code.');
  }

  return {
    userId: authUser.data.user.id,
    attempts: verification.attempts,
  };
}

async function recordFailedVerificationAttempt(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const verification = readEmailVerificationMetadata(user);

  if (!verification) {
    return;
  }

  await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      email_verification: {
        ...verification,
        attempts: verification.attempts + 1,
      },
    },
  });
}

async function markVerificationCodeConsumed(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const authUser = await supabase.auth.admin.getUserById(userId);

  if (authUser.error || !authUser.data.user) {
    throw authUser.error ?? new HttpError(500, 'Could not verify account.');
  }

  const appMetadata = { ...authUser.data.user.app_metadata };
  delete appMetadata['email_verification'];

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    app_metadata: appMetadata,
  });

  if (error) {
    throw error;
  }
}

async function confirmSupabaseUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new HttpError(500, 'Could not verify account.');
  }

  const email = data.user.email;
  const metadataName = data.user.user_metadata?.['name'];
  const name = typeof metadataName === 'string' && metadataName.trim()
    ? metadataName.trim()
    : nameFromEmail(email ?? '');

  const upserted = await supabase
    .from('users')
    .upsert({
      id: data.user.id,
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

  return /^\d{6}$/.test(normalized) ? normalized : '';
}

function hashVerificationCode(email: string, code: string): string {
  const pepper = process.env['AUTH_CODE_PEPPER'] ?? process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? 'readtrack-dev-pepper';

  return createHash('sha256')
    .update(`${email}:${code}:${pepper}`)
    .digest('hex');
}

function readEmailVerificationMetadata(user: User): EmailVerificationMetadata | null {
  const metadata = user.app_metadata?.['email_verification'];

  if (
    typeof metadata !== 'object' ||
    metadata === null ||
    !('email' in metadata) ||
    !('code_hash' in metadata) ||
    !('expires_at' in metadata)
  ) {
    return null;
  }

  const verification = metadata as Partial<EmailVerificationMetadata>;

  if (
    typeof verification.email !== 'string' ||
    typeof verification.code_hash !== 'string' ||
    typeof verification.expires_at !== 'string'
  ) {
    return null;
  }

  return {
    email: verification.email,
    code_hash: verification.code_hash,
    expires_at: verification.expires_at,
    attempts: typeof verification.attempts === 'number' ? verification.attempts : 0,
  };
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
