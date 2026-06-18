// Verify each finding from the pentest report against the CURRENT live state.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
// anonClient: NO user session — pure anon role (role=anon).
const anonNoAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
// A logged-in user client.
const userClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: login } = await userClient.auth.signInWithPassword({ email: 'aria.reader.seed@gmail.com', password: 'SeedPass123!' });
const ariaId = login.user.id;
const noahId = (await admin.from('users').select('id').eq('email', 'noah.books.seed@gmail.com').maybeSingle()).data?.id;

console.log('=== V-E: anon (no user token) reading content ===');
for (const t of ['posts', 'user_books', 'post_likes', 'comments']) {
  const { data, error } = await anonNoAuth.from(t).select('*').limit(5);
  console.log(`  ${t}: rows=${data?.length ?? 0} err=${error?.message ?? 'none'}`);
}
console.log('  books (catalog, expected readable to authed):');
const bAnon = await anonNoAuth.from('books').select('book_id').limit(3);
console.log(`    anon books rows=${bAnon.data?.length ?? 0} err=${bAnon.error?.message ?? 'none'}`);

console.log('\n=== V-C: IDOR read another user\'s shelf/notes (as logged-in aria) ===');
const noahBooks = await userClient.from('user_books').select('book_id, rating, review_text').eq('user_id', noahId);
console.log(`  noah (private) user_books visible to aria: rows=${noahBooks.data?.length ?? 0}`);
const noteCol = await userClient.from('user_books').select('note').limit(1);
console.log(`  user_books.note column: ${noteCol.error ? 'GONE ✅ ('+noteCol.error.message+')' : 'STILL EXISTS ❌'}`);
const notesTable = await userClient.from('user_book_notes').select('user_book_id').neq('user_id', ariaId);
console.log(`  other users' notes readable: rows=${notesTable.data?.length ?? 0}`);

console.log('\n=== V-B: books write as logged-in user ===');
const aBook = (await userClient.from('books').select('book_id, title').limit(1).maybeSingle()).data;
await userClient.from('books').update({ title: 'PROBE_HACK' }).eq('book_id', aBook.book_id);
const after = (await userClient.from('books').select('title').eq('book_id', aBook.book_id).maybeSingle()).data;
console.log(`  book update blocked: ${after?.title === aBook.title ? 'YES ✅' : 'NO ❌ (title='+after?.title+')'}`);
if (after?.title !== aBook.title) await admin.from('books').update({ title: aBook.title }).eq('book_id', aBook.book_id);

console.log('\nDone.');
process.exit(0);
