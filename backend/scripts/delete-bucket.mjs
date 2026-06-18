import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

function loadEnv() {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {}
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.SUPABASE_URL ?? 'https://qgoermeodyyfrfoyvnvo.supabase.co';
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = env.GOOGLE_BOOKS_API_KEY;
const BUCKET = 'book-covers';
const MARKER = `/storage/v1/object/public/${BUCKET}/`;

if (!SERVICE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Known seed books whose google_books_id doesn't resolve on Google Books.
const SEED = {
  h1UotAAACAAJ: 'https://covers.openlibrary.org/b/id/8432503-L.jpg',
  '0T1BAQAAQBAJ': 'https://covers.openlibrary.org/b/id/8228691-L.jpg',
  gnmZAAAAMAAJ: 'https://covers.openlibrary.org/b/id/10306750-L.jpg',
  BEBLUlwbgB8C: 'https://covers.openlibrary.org/b/id/8704703-L.jpg',
};

async function googleThumb(id) {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}${GOOGLE_KEY ? `?key=${GOOGLE_KEY}` : ''}`);
    if (!res.ok) return null;
    const data = await res.json();
    const t = data?.volumeInfo?.imageLinks?.thumbnail ?? null;
    return t ? t.replace('http://', 'https://') : null;
  } catch { return null; }
}

// 1. Fix any rows still pointing at the bucket so they don't 404.
const { data: rows } = await admin
  .from('books')
  .select('book_id, google_books_id, cover_image_url')
  .like('cover_image_url', `%${MARKER}%`);

console.log(`Rows still pointing at bucket: ${rows?.length ?? 0}`);
for (const r of rows ?? []) {
  const url = SEED[r.google_books_id] ?? (await googleThumb(r.google_books_id));
  await admin.from('books').update({ cover_image_url: url }).eq('book_id', r.book_id);
  console.log(`  ${r.google_books_id} -> ${url ?? 'null'}`);
}

// 2. Empty + delete the bucket via the Storage API.
const { error: e1 } = await admin.storage.emptyBucket(BUCKET);
if (e1 && !/not found/i.test(e1.message)) { console.error('empty failed:', e1.message); process.exit(1); }

const { error: e2 } = await admin.storage.deleteBucket(BUCKET);
if (e2 && !/not found/i.test(e2.message)) { console.error('delete failed:', e2.message); process.exit(1); }

console.log(`Bucket "${BUCKET}" emptied and deleted.`);
