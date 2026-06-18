// Final comprehensive smoke test.
//  - Happy paths for every endpoint
//  - Error/abuse probes: bad input, no auth, wrong owner, oversized, etc.
//  - HARD ASSERT: no endpoint ever returns HTTP 500 (internal server error)
//  - Full friend lifecycle (request → accept → status → delete), self-cleaning
// Run: node scripts/smoke-test.mjs   (stack must be up at https://localhost:8443)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const BASE = 'https://localhost:8443';
const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let pass = 0, fail = 0, serverErrors = 0;
const ok = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

async function login(email) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password: 'SeedPass123!' });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { token: data.session.access_token, userId: data.user.id };
}

// Calls the API and records a global failure if the status is 500.
async function call(method, path, token, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await res.json(); } catch { /* */ }
  if (res.status === 500) { serverErrors++; console.log(`  ‼️  500 from ${method} ${path}  body=${JSON.stringify(json)}`); }
  return { status: res.status, body: json };
}
const no500 = (s) => s !== 500;

const main = async () => {
  const aria = await login('aria.reader.seed@gmail.com');
  const leo = await login('leo.reads.seed@gmail.com');
  const zoe = await login('zoe.shelf.seed@gmail.com');
  console.log(`Logged in aria/leo/zoe\n`);

  const { data: book } = await anon.from('books').select('book_id, google_books_id').not('google_books_id', 'is', null).limit(1).maybeSingle();
  const bookId = book?.book_id;

  console.log('=== HAPPY PATHS ===');
  let r;
  r = await call('GET', '/api/health'); ok('health', r.status === 200);
  r = await call('GET', '/api/books/search?q=dune', aria.token); ok('books search', r.status === 200);
  r = await call('GET', `/api/books/${book.google_books_id}`, aria.token); ok('book detail', r.status === 200);
  r = await call('GET', '/api/stats/global?period=week', aria.token); ok('stats global', r.status === 200);
  r = await call('GET', '/api/stats/pace', aria.token); ok('stats pace', r.status === 200);
  r = await call('GET', '/api/friends', aria.token); ok('friends list', r.status === 200);
  r = await call('GET', '/api/friends/requests', aria.token); ok('friend requests', r.status === 200);
  r = await call('GET', `/api/friends/status/${leo.userId}`, aria.token); ok('friend status', r.status === 200, `status=${r.body?.status}`);
  r = await call('GET', `/api/recommendations/${aria.userId}`, aria.token); ok('recommendations', r.status === 200);
  r = await call('GET', '/api/community/posts', aria.token); ok('community posts', r.status === 200);
  r = await call('GET', '/api/community/tags/trending', aria.token); ok('trending tags', r.status === 200);
  r = await call('GET', '/api/notifications', aria.token); ok('notifications', r.status === 200);
  r = await call('GET', '/api/notifications/unread-count', aria.token); ok('unread count', r.status === 200);
  r = await call('POST', '/api/books/ensure', aria.token, { googleId: book.google_books_id }); ok('books ensure (existing)', r.status === 200 || r.status === 201);

  console.log('\n=== AUTH REQUIRED (no token → 401, never 500) ===');
  for (const [m, p, b] of [
    ['GET', '/api/friends'], ['POST', '/api/community/posts', { bookId, content: 'x' }],
    ['POST', '/api/community/comments', { postId: 1, content: 'x' }], ['POST', '/api/books/ensure', { googleId: 'x' }],
    ['GET', `/api/recommendations/${aria.userId}`], ['POST', '/api/recommendations/friend', { toUserId: leo.userId, bookId }],
    ['DELETE', '/api/notifications/1'], ['POST', '/api/friends/request', { toUserId: leo.userId }],
  ]) {
    r = await call(m, p, null, b); ok(`${m} ${p} → 401`, r.status === 401, `got ${r.status}`);
  }

  console.log('\n=== BAD INPUT (→ 4xx, never 500) ===');
  r = await call('POST', '/api/books/ensure', aria.token, {}); ok('ensure no googleId → 4xx', r.status >= 400 && r.status < 500 && no500(r.status), `got ${r.status}`);
  r = await call('POST', '/api/community/posts', aria.token, { content: '' }); ok('post empty → 400', r.status === 400, `got ${r.status}`);
  r = await call('POST', '/api/community/posts', aria.token, { bookId, content: 'x'.repeat(2100) }); ok('post oversized → 400', r.status === 400, `got ${r.status}`);
  r = await call('POST', '/api/community/posts', aria.token, { bookId: 999999999, content: 'hello there nice book' }); ok('post bad bookId → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('POST', '/api/community/comments', aria.token, { postId: 999999999, content: 'hi' }); ok('comment bad postId → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('POST', '/api/community/comments', aria.token, {}); ok('comment missing → 400', r.status === 400, `got ${r.status}`);
  r = await call('POST', '/api/friends/request', aria.token, {}); ok('friend req missing → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('POST', '/api/friends/request', aria.token, { toUserId: aria.userId }); ok('friend req self → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('PATCH', '/api/friends/999999/accept', aria.token); ok('accept nonexistent → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('DELETE', '/api/notifications/999999', aria.token); ok('delete nonexistent notif → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('GET', `/api/recommendations/${leo.userId}`, aria.token); ok('recs for other user → 401', r.status === 401, `got ${r.status}`);
  r = await call('GET', '/api/books/__nonexistent_id__', aria.token); ok('book bad id → 404/502 (not 500)', (r.status === 404 || r.status === 502), `got ${r.status}`);
  r = await call('GET', '/api/books/search?q=', aria.token); ok('search empty q → 200 empty', r.status === 200);
  r = await call('GET', '/api/stats/global?period=garbage', aria.token); ok('stats bad period → 200', r.status === 200);
  r = await call('POST', '/api/recommendations/friend', aria.token, {}); ok('recommend missing → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('POST', '/api/recommendations/friend', aria.token, { toUserId: aria.userId, bookId }); ok('recommend to self → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);

  console.log('\n=== AUTH ENDPOINTS (bad input → 4xx, never 500) ===');
  r = await call('POST', '/api/auth/request-signup', null, { email: 'x@evilcorp.ru', password: 'Passw0rd!', name: 'X' }); ok('signup bad domain → 4xx', r.status >= 400 && no500(r.status), `got ${r.status} ${r.body?.code ?? ''}`);
  r = await call('POST', '/api/auth/request-signup', null, {}); ok('signup missing → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('POST', '/api/auth/request-signup', null, { email: 'a@gmail.com', password: 'x'.repeat(100), name: 'X' }); ok('signup long password → 4xx', r.status >= 400 && no500(r.status), `got ${r.status} ${r.body?.code ?? ''}`);
  r = await call('POST', '/api/auth/verify-email', null, { email: 'a@gmail.com', code: '000000' }); ok('verify bad code → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('POST', '/api/auth/resend-verification', null, { email: 'nobody.unknown@gmail.com' }); ok('resend unknown email → 2xx (no leak)', r.status >= 200 && r.status < 300, `got ${r.status}`);

  console.log('\n=== FRIEND LIFECYCLE (leo ↔ zoe, self-cleaning) ===');
  // Ensure they start unconnected.
  r = await call('GET', `/api/friends/status/${zoe.userId}`, leo.token); ok('leo↔zoe initially none', r.body?.status === 'none', `status=${r.body?.status}`);
  r = await call('POST', '/api/friends/request', leo.token, { toUserId: zoe.userId }); ok('leo requests zoe → 2xx', r.status >= 200 && r.status < 300, `got ${r.status}`);
  const fid = r.body?.friendshipId;
  r = await call('POST', '/api/friends/request', leo.token, { toUserId: zoe.userId }); ok('duplicate request → 409', r.status === 409, `got ${r.status}`);
  r = await call('PATCH', `/api/friends/${fid}/accept`, leo.token); ok('requester cannot accept own → 4xx', r.status >= 400 && no500(r.status), `got ${r.status}`);
  r = await call('PATCH', `/api/friends/${fid}/accept`, zoe.token); ok('zoe accepts → 2xx', r.status >= 200 && r.status < 300, `got ${r.status}`);
  r = await call('GET', `/api/friends/status/${zoe.userId}`, leo.token); ok('now accepted', r.body?.status === 'accepted', `status=${r.body?.status}`);
  r = await call('DELETE', `/api/friends/${fid}`, leo.token); ok('leo removes friend → 2xx', r.status >= 200 && r.status < 300, `got ${r.status}`);
  r = await call('GET', `/api/friends/status/${zoe.userId}`, leo.token); ok('back to none (clean)', r.body?.status === 'none', `status=${r.body?.status}`);

  console.log('\n=== MODERATION (post + comment) ===');
  r = await call('POST', '/api/community/posts', aria.token, { bookId, content: 'Loved this, beautifully written and paced.' }); ok('clean post → 201', r.status === 201);
  const cleanPost = r.body?.id;
  r = await call('POST', '/api/community/posts', aria.token, { bookId, content: 'this fucking book is trash and the author is a moron' }); ok('abusive post → 422', r.status === 422);
  if (cleanPost) {
    r = await call('POST', '/api/community/comments', leo.token, { postId: cleanPost, content: 'Nice review!' }); ok('clean comment → 201', r.status === 201);
    // cleanup the test post
    await admin.from('comments').delete().eq('post_id', cleanPost);
    await admin.from('posts').delete().eq('post_id', cleanPost);
  }

  console.log(`\n${fail === 0 && serverErrors === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed, ${serverErrors} server-errors(500)`);
  process.exit(fail === 0 && serverErrors === 0 ? 0 : 1);
};

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
