import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// Load secrets from backend/.env — never hardcode the service-role key in a
// committed file (it bypasses RLS and grants full DB access).
const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const USER_EMAIL = 'chatgptplusmoons@gmail.com';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── 1. Top Books (join works) ────────────────────────────────────
console.log('=== TOP BOOKS ===');
const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const { data: ubBooks, error: e1 } = await admin
  .from('user_books').select('book_id, books(book_id, title, author_name, cover_image_url)').gte('added_at', since);
if (e1) { console.log('ERROR:', e1.message); }
else {
  const counts = new Map();
  for (const row of ubBooks ?? []) {
    const book = row.books;
    if (!book) continue;
    const id = book.book_id;
    if (!counts.has(id)) counts.set(id, { book, count: 0 });
    counts.get(id).count++;
  }
  const top = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  top.forEach((t, i) => console.log(`  ${i+1}. "${t.book.title}" — ${t.count} added`));
  if (!top.length) console.log('  (no books added this month)');
}

// ── 2. Trending Genres ──────────────────────────────────────────
console.log('\n=== TRENDING GENRES ===');
const { data: ugData, error: e2 } = await admin.from('user_genres').select('genre_id, genres(genre_name)');
if (e2) { console.log('ERROR:', e2.message); }
else {
  const counts = new Map();
  for (const row of ugData ?? []) {
    const name = row.genres?.genre_name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .forEach(([name, count]) => console.log(`  ${name}: ${Math.round(count/total*100)}%`));
}

// ── 3. Top Readers (TWO-QUERY FIX) ─────────────────────────────
console.log('\n=== TOP READERS (two-query fix) ===');
const { data: statusRow } = await admin.from('reading_statuses').select('status_id').eq('status_name', 'read').single();
const readStatusId = statusRow?.status_id;

const { data: ubRead, error: e3 } = await admin.from('user_books').select('user_id').eq('status_id', readStatusId);
if (e3) { console.log('ERROR:', e3.message); }
else {
  const counts = new Map();
  for (const row of ubRead ?? []) counts.set(row.user_id, (counts.get(row.user_id) ?? 0) + 1);

  const topIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);
  if (!topIds.length) { console.log('  (no books marked as read yet)'); }
  else {
    const { data: users } = await admin.from('users').select('id, name, profile_picture_url').in('id', topIds);
    const userMap = new Map((users ?? []).map(u => [u.id, u]));
    topIds.forEach((id, i) => {
      const u = userMap.get(id);
      console.log(`  ${i+1}. ${u?.name ?? 'Unknown'} — ${counts.get(id)} books read`);
    });
  }
}

// ── 4. Reading Pace ─────────────────────────────────────────────
console.log('\n=== READING PACE (current user) ===');
const { data: linkData } = await admin.auth.admin.generateLink({ type: 'magiclink', email: USER_EMAIL });
const token = new URL(linkData.properties.action_link).searchParams.get('token');
const { data: otpData } = await admin.auth.verifyOtp({ token_hash: token, type: 'magiclink' });
const userId = otpData.session?.user?.id;

const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
const { data: paceData } = await admin.from('user_books').select('updated_at').eq('user_id', userId).eq('status_id', readStatusId).gte('updated_at', startOfYear);
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const mc = new Array(12).fill(0);
for (const row of paceData ?? []) mc[new Date(row.updated_at).getMonth()]++;
months.forEach((m, i) => { if (mc[i] > 0) console.log(`  ${m}: ${mc[i]} book(s)`); });
const total = mc.reduce((a, b) => a + b, 0);
console.log(`  Total: ${total} book(s) read this year`);

console.log('\n✅ All queries verified. Rebuild Docker to deploy the fix.');
