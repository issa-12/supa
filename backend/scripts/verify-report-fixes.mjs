// Verify each pentest-report finding is fixed against the live stack.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const BASE = 'https://localhost:8443';
// Separate clients: `anon` is used to LOG IN (becomes authenticated); `anonClean`
// is NEVER signed in, so it stays the pure anon role for the V-E checks.
const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const anonClean = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let pass = 0, fail = 0;
const ok = (n, c, e = '') => { c ? pass++ : fail++; console.log(`  ${c ? 'PASS' : 'FAIL'}  ${n}${e ? '  — ' + e : ''}`); };

async function apiRaw(path, token, opts = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...h, ...(opts.headers || {}) } });
  let b = null; try { b = await res.json(); } catch {}
  return { status: res.status, body: b };
}

// verified seed user token
const { data: aria } = await anon.auth.signInWithPassword({ email: 'aria.reader.seed@gmail.com', password: 'SeedPass123!' });
const ariaToken = aria.session.access_token;

console.log('=== V-A: rate limiting on auth (burst → 429) ===');
let got429 = false, statuses = [];
for (let i = 0; i < 12; i++) {
  const r = await apiRaw('/api/auth/request-signup', null, { method: 'POST', body: JSON.stringify({ email: 'ratelimit.probe@gmail.com', password: 'Passw0rd!', name: 'RL' }) });
  statuses.push(r.status);
  if (r.status === 429) got429 = true;
}
ok('burst of 12 signups gets throttled (429)', got429, `statuses=${statuses.join(',')}`);

console.log('\n=== V-D: unverified email cannot use the API ===');
const tmpEmail = `unverified.${Date.now()}@gmail.com`;
const { data: created } = await admin.auth.admin.createUser({ email: tmpEmail, password: 'SeedPass123!', email_confirm: true, user_metadata: { app_email_verified: false } });
const tmpId = created.user.id;
const { data: tmpLogin, error: tmpErr } = await anon.auth.signInWithPassword({ email: tmpEmail, password: 'SeedPass123!' });
if (tmpErr) { ok('unverified can get a Supabase JWT (setup)', false, tmpErr.message); }
else {
  const tok = tmpLogin.session.access_token;
  const r1 = await apiRaw('/api/community/posts', tok);
  ok('unverified token rejected on protected endpoint', r1.status === 401, `got ${r1.status}`);
  const r2 = await apiRaw('/api/friends', tok);
  ok('unverified token rejected on /api/friends', r2.status === 401, `got ${r2.status}`);
}
// verified user still works
const r3 = await apiRaw('/api/friends', ariaToken);
ok('verified user still works', r3.status === 200, `got ${r3.status}`);
await admin.auth.admin.deleteUser(tmpId).catch(() => {});
await admin.from('users').delete().eq('id', tmpId);

console.log('\n=== V-E: anon (no login) cannot read content tables ===');
for (const t of ['posts', 'comments', 'post_likes', 'books', 'user_books']) {
  const { data, error } = await anonClean.from(t).select('*').limit(3);
  // After REVOKE, anon gets either an error or 0 rows. Treat rows>0 as FAIL.
  ok(`anon ${t} not readable`, (data?.length ?? 0) === 0, `rows=${data?.length ?? 0} err=${error?.code ?? 'none'}`);
}

console.log('\n=== V-F: malformed tag filter does not 500 ===');
const evilTag = encodeURIComponent("test');DROP TABLE posts;--");
const r = await apiRaw(`/api/community/posts?tag=${evilTag}`, ariaToken);
ok('malformed tag → not 500', r.status !== 500, `got ${r.status}`);

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
