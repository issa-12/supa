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
const KEY = env.GOOGLE_BOOKS_API_KEY;

const { data: login } = await anon.auth.signInWithPassword({ email: 'aria.reader.seed@gmail.com', password: 'SeedPass123!' });
const token = login.session.access_token;
const ariaId = login.user.id;

console.log('=== 1. /api/recommendations (home recommended books) ===');
const res = await fetch(`${BASE}/api/recommendations/${ariaId}`, { headers: { Authorization: `Bearer ${token}` } });
console.log(`status=${res.status}`);
const body = await res.json().catch(() => ({}));
const books = body.books ?? [];
console.log(`books=${books.length}`);
for (const b of books.slice(0, 6)) {
  console.log(`  - "${b.title}" cover=${b.coverUrl ? 'YES' : 'NULL'} googleId=${b.googleBooksId ?? 'NULL'} dbBookId=${b.dbBookId ?? 'null'}`);
}

console.log('\n=== 2. Book detail for each recommended googleId ===');
for (const b of books.slice(0, 4)) {
  if (!b.googleBooksId) { console.log(`  "${b.title}": NO googleBooksId → cannot open`); continue; }
  const r = await fetch(`${BASE}/api/books/${b.googleBooksId}`, { headers: { Authorization: `Bearer ${token}` } });
  console.log(`  "${b.title}" (${b.googleBooksId}): detail HTTP ${r.status}`);
}

console.log('\n=== 3. ai_recommendations cache row ===');
const { data: cache } = await admin.from('ai_recommendations').select('user_id, expires_at, recommendations').eq('user_id', ariaId).maybeSingle();
if (cache) {
  const recs = cache.recommendations;
  const arr = Array.isArray(recs) ? recs : (recs?.books ?? []);
  console.log(`  cached items=${arr.length} expires=${cache.expires_at}`);
  console.log(`  sample: ${JSON.stringify(arr[0] ?? {}).slice(0, 200)}`);
} else { console.log('  no cache row'); }

console.log('\n=== 4. Google Books API health right now ===');
const g = await fetch(`https://www.googleapis.com/books/v1/volumes/pD6arNyKyi8C${KEY ? `?key=${KEY}` : ''}`);
console.log(`  GET volume: HTTP ${g.status}`);
const gs = await fetch(`https://www.googleapis.com/books/v1/volumes?q=dune${KEY ? `&key=${KEY}` : ''}`);
console.log(`  search: HTTP ${gs.status}`);
process.exit(0);
