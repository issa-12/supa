// One-off: verify custom SMTP works by triggering a real password-reset email.
// Reports whether Supabase accepted the send (SMTP OK) or errored (SMTP bad).
//   node test-reset.mjs your@email.com
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const email = process.argv[2];
if (!email) { console.error('Usage: node test-reset.mjs your@email.com'); process.exit(1); }

const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });

console.log(`Triggering password reset for ${email} …`);
const { error } = await anon.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://localhost:8443/reset-password',
});

if (error) {
  console.log(`\n❌ Supabase returned an error — SMTP likely misconfigured:`);
  console.log(`   status=${error.status}  message="${error.message}"`);
  console.log(`   (A "Error sending recovery email" / 500 here = bad SMTP host/port/app-password.)`);
  process.exit(1);
}
console.log('\n✅ Supabase accepted the request (no SMTP error).');
console.log('   Now check the inbox (and Spam) for that address.');
console.log('   If the email arrives → custom SMTP is working end-to-end.');
