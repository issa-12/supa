// Diagnose the signup OTP / magic-link send (the step that's failing).
// Calls signInWithOtp exactly like AuthService.issueVerificationCode and prints
// the raw error so we can see whether it's SMTP, rate limit, or template.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const email = process.argv[2] || 'aria.reader.seed@gmail.com';
const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });

console.log(`signInWithOtp(${email}, shouldCreateUser:false) …`);
const { data, error } = await anon.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });

if (error) {
  console.log('\n❌ ERROR:');
  console.log('   status :', error.status);
  console.log('   code   :', error.code);
  console.log('   name   :', error.name);
  console.log('   message:', error.message);
} else {
  console.log('\n✅ OTP send accepted (no error). data:', JSON.stringify(data));
}
