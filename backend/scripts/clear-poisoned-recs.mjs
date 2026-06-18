// Delete ai_recommendations cache rows that contain coverless/un-openable books
// (null googleBooksId) — they were cached during a Google Books outage. They'll
// regenerate cleanly on the next request now that Google is healthy.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: rows } = await admin.from('ai_recommendations').select('user_id, recommendations');
let poisoned = 0;
for (const r of rows ?? []) {
  const recs = Array.isArray(r.recommendations) ? r.recommendations : (r.recommendations?.books ?? []);
  const bad = recs.some((b) => !b.googleBooksId || !b.coverUrl);
  if (bad || recs.length === 0) {
    await admin.from('ai_recommendations').delete().eq('user_id', r.user_id);
    poisoned++;
  }
}
console.log(`Checked ${rows?.length ?? 0} cache rows; deleted ${poisoned} poisoned.`);
process.exit(0);
