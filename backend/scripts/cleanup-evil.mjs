import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data } = await admin.from('books').select('book_id, google_books_id').like('google_books_id', 'evil-%');
console.log(`Junk 'evil-' books found: ${data?.length ?? 0}`);
for (const b of data ?? []) { await admin.from('books').delete().eq('book_id', b.book_id); console.log(`  deleted ${b.google_books_id}`); }
console.log('Done.');
