// Diagnose who can actually see a posted review.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });

// 1. Admin view: is_public values on rows that have a review.
const { data: rows } = await admin
  .from('user_books')
  .select('user_book_id, user_id, is_public, review_text')
  .not('review_text', 'is', null)
  .limit(20);
console.log('=== Reviews in DB (admin view) ===');
const pubCounts = { true: 0, false: 0, null: 0 };
for (const r of rows ?? []) pubCounts[String(r.is_public)]++;
console.log('is_public distribution among reviews:', pubCounts);

// 2. Client view: log in as aria, try to read OTHER users' reviews (RLS-bound).
const { data: login } = await anon.auth.signInWithPassword({ email: 'aria.reader.seed@gmail.com', password: 'SeedPass123!' });
const ariaId = login.user.id;
const { data: visible } = await anon
  .from('user_books')
  .select('user_book_id, user_id, review_text')
  .not('review_text', 'is', null)
  .neq('user_id', ariaId);
console.log(`\n=== As aria, OTHER users' reviews visible via client (RLS) ===`);
console.log(`count = ${visible?.length ?? 0}`);
console.log('(If >0, reviews are visible to ANY logged-in user, not just friends.)');
console.log('(If 0, no one but the author can see reviews via the normal app query.)');
