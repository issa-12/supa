// Repair any vandalized book rows by re-syncing authoritative metadata from
// Google Books (admin client). Books whose google_books_id doesn't resolve on
// Google (e.g. local seed IDs) are left untouched.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const KEY = env.GOOGLE_BOOKS_API_KEY;

const { data: books } = await admin.from('books').select('book_id, google_books_id, title').not('google_books_id', 'is', null);
console.log(`Re-syncing ${books?.length ?? 0} books from Google Books…`);
let fixed = 0;
for (const b of books ?? []) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${b.google_books_id}${KEY ? `?key=${KEY}` : ''}`);
    if (!res.ok) { continue; }
    const v = (await res.json()).volumeInfo ?? {};
    const title = v.title ?? null;
    if (!title) continue;
    const author = (v.authors ?? []).join(', ') || 'Unknown Author';
    const description = v.description ?? null;
    const cover = v.imageLinks?.thumbnail ? v.imageLinks.thumbnail.replace('http://', 'https://') : null;
    const changed = b.title !== title;
    await admin.from('books').update({
      title, author_name: author, description, ...(cover ? { cover_image_url: cover } : {}),
    }).eq('book_id', b.book_id);
    if (changed) { console.log(`  fixed "${b.title}" -> "${title}"`); fixed++; }
  } catch { /* skip */ }
}
console.log(`\nDone. ${fixed} title(s) corrected.`);
