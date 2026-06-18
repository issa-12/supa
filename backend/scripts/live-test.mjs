// =============================================================
// Live end-to-end test against the running Docker stack
// (https://localhost:8443). Focuses on moderation + core API.
//   node live-test.mjs
// =============================================================
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // self-signed cert on localhost

const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const SUPABASE_URL = env.SUPABASE_URL;
const ANON = env.SUPABASE_ANON_KEY;
const BASE = 'https://localhost:8443';

const anon = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { (cond ? pass++ : fail++); console.log(`  ${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); };

async function login(email, password) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`login ${email}: ${error.message}`);
  return { token: data.session.access_token, userId: data.user.id };
}

async function api(path, token, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* non-json */ }
  return { status: res.status, body };
}

const main = async () => {
  const aria = await login('aria.reader.seed@gmail.com', 'SeedPass123!');
  const leo = await login('leo.reads.seed@gmail.com', 'SeedPass123!');
  console.log(`Logged in: aria=${aria.userId.slice(0, 8)} leo=${leo.userId.slice(0, 8)}`);

  // A book_id to attach posts to.
  const { data: book } = await anon.from('books').select('book_id').eq('google_books_id', 'B1hSG45JCX4C').maybeSingle();
  const bookId = book?.book_id;

  console.log('\n=== CORE API ===');
  let r;
  r = await api('/api/health', aria.token); ok('GET /api/health', r.status === 200 && r.body?.status === 'ok');
  r = await api('/api/books/search?q=dune&maxResults=3', aria.token); ok('GET /api/books/search', r.status === 200 && Array.isArray(r.body?.books));
  r = await api('/api/books/B1hSG45JCX4C', aria.token); ok('GET /api/books/:id (DB hit)', r.status === 200 && r.body?.dbBookId, `ratingStats total=${r.body?.ratingStats?.total}`);
  r = await api(`/api/stats/global?period=month`, aria.token); ok('GET /api/stats/global', r.status === 200 && Array.isArray(r.body?.topBooks), `topBooks=${r.body?.topBooks?.length}`);
  r = await api('/api/stats/pace', aria.token); ok('GET /api/stats/pace', r.status === 200);
  r = await api('/api/friends', aria.token); ok('GET /api/friends', r.status === 200 && Array.isArray(r.body), `count=${r.body?.length}`);
  r = await api('/api/friends/requests', aria.token); ok('GET /api/friends/requests (pending from noah)', r.status === 200 && Array.isArray(r.body), `count=${r.body?.length}`);
  r = await api(`/api/recommendations/${aria.userId}`, aria.token); ok('GET /api/recommendations/:id', r.status === 200 && Array.isArray(r.body?.books), `n=${r.body?.books?.length}`);
  r = await api('/api/community/posts', aria.token); ok('GET /api/community/posts (feed)', r.status === 200 && Array.isArray(r.body), `posts=${r.body?.length}`);
  r = await api('/api/community/tags/trending', aria.token); ok('GET /api/community/tags/trending', r.status === 200 && Array.isArray(r.body));

  console.log('\n=== MODERATION: POSTS ===');
  const post = (content, tags = []) => api('/api/community/posts', aria.token, { method: 'POST', body: JSON.stringify({ bookId, content, tags }) });

  r = await post('I absolutely loved this book — the world-building is incredible and the pacing kept me hooked.');
  ok('clean post → 201 approved', r.status === 201, `status=${r.status}`);
  const cleanPostId = r.body?.id;

  r = await post('This book is fucking garbage and whoever wrote it is a complete idiot.');
  ok('profane/abusive post → 422 blocked', r.status === 422, `status=${r.status} msg="${r.body?.message ?? ''}"`);

  r = await post('Honestly this was a boring, poorly written mess. The characters were flat and I hated almost every chapter.');
  ok('harsh-but-clean criticism → 201 approved (narrowed policy)', r.status === 201, `status=${r.status} msg="${r.body?.message ?? ''}"`);

  r = await post('BUY CHEAP FOLLOWERS NOW!!! visit spam-link dot com for free crypto giveaway click click click');
  ok('spam post → 422 blocked', r.status === 422, `status=${r.status}`);

  console.log('\n=== MODERATION: COMMENTS ===');
  const comment = (content, postId) => api('/api/community/comments', leo.token, { method: 'POST', body: JSON.stringify({ postId, content }) });
  if (cleanPostId) {
    r = await comment('Great review, totally agree with your points!', cleanPostId);
    ok('clean comment → 201', r.status === 201, `status=${r.status}`);
    r = await comment('You are a fucking moron if you liked this trash.', cleanPostId);
    ok('abusive comment → 422 blocked', r.status === 422, `status=${r.status} msg="${r.body?.message ?? ''}"`);
  } else {
    ok('comment tests (need a clean post id)', false, 'no clean post created');
  }

  console.log('\n=== PRIVATE ACCOUNT (noah) ===');
  // Noah is private and NOT aria's friend (only a pending request). Aria should
  // not see noah in the community feed authors.
  const noahId = (await anon.from('users').select('id').eq('email', 'noah.books.seed@gmail.com').maybeSingle()).data?.id;
  r = await api('/api/community/posts', aria.token);
  const feedHasNoah = (r.body ?? []).some((p) => p.userId === noahId);
  ok('private non-friend hidden from feed', !feedHasNoah);

  console.log('\n=== RLS: PRIVATE ACCOUNT ENFORCED CLIENT-SIDE (noah) ===');
  // Direct client (RLS-bound) reads of a private non-friend must return nothing.
  const ubNoah = await anon.from('user_books').select('user_book_id').eq('user_id', noahId);
  ok('private non-friend user_books hidden via direct API', (ubNoah.data?.length ?? 0) === 0, `rows=${ubNoah.data?.length ?? 0}`);
  const postsNoah = await anon.from('posts').select('post_id').eq('user_id', noahId).neq('is_deleted', true);
  ok('private non-friend posts hidden via direct API', (postsNoah.data?.length ?? 0) === 0, `rows=${postsNoah.data?.length ?? 0}`);
  // Leo IS aria's friend and public — aria should still see leo's books.
  const ubLeo = await anon.from('user_books').select('user_book_id').eq('user_id', leo.userId);
  ok('public/friend user_books still visible', (ubLeo.data?.length ?? 0) > 0, `rows=${ubLeo.data?.length ?? 0}`);

  console.log('\n=== NOTES ARE TRULY PRIVATE ===');
  // The note column must be gone from user_books, and notes table is owner-only.
  const ubCols = await anon.from('user_books').select('note').eq('user_id', aria.userId).limit(1);
  ok('user_books.note column removed', !!ubCols.error, `err="${ubCols.error?.message ?? 'none'}"`);
  const othersNotes = await anon.from('user_book_notes').select('user_book_id').neq('user_id', aria.userId);
  ok("cannot read other users' notes (owner-only RLS)", (othersNotes.data?.length ?? 0) === 0, `rows=${othersNotes.data?.length ?? 0}`);

  console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
};

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
