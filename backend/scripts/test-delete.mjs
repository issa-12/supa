// Diagnose account deletion: does deleting the auth user also remove the
// public.users row (FK cascade)? If the row lingers, the user still shows in
// search — the reported bug.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = {};
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const email = `tmp.deltest.${Date.now()}@gmail.com`;
console.log(`Creating temp user ${email} …`);
const { data: created, error: ce } = await admin.auth.admin.createUser({
  email, password: 'SeedPass123!', email_confirm: true, user_metadata: { name: 'Del Test', app_email_verified: true },
});
if (ce) { console.error('create failed:', ce.message); process.exit(1); }
const id = created.user.id;
await admin.from('users').upsert({ id, email, name: 'Del Test', verified: true }, { onConflict: 'id' });
await admin.from('profiles').upsert({ user_id: id, name: 'Del Test' }, { onConflict: 'user_id' }).then(() => {}, () => {});
// give it a shelf row so we also see whether children cascade
const { data: anyBook } = await admin.from('books').select('book_id').limit(1).maybeSingle();
const { data: st } = await admin.from('reading_statuses').select('status_id').eq('status_name', 'want_to_read').maybeSingle();
if (anyBook && st) await admin.from('user_books').insert({ user_id: id, book_id: anyBook.book_id, status_id: st.status_id }).then(()=>{},()=>{});

console.log('Deleting auth user (hard delete) …');
const { error: de } = await admin.auth.admin.deleteUser(id);
console.log('  deleteUser error:', de?.message ?? 'none');

const { data: pubRow } = await admin.from('users').select('id, email').eq('id', id).maybeSingle();
const { data: ubRows } = await admin.from('user_books').select('user_book_id').eq('user_id', id);

console.log(`\npublic.users row after delete : ${pubRow ? 'STILL EXISTS ❌' : 'gone ✅'}`);
console.log(`user_books rows after delete  : ${ubRows?.length ?? 0}`);

if (pubRow) {
  console.log('\n→ FK cascade public.users → auth.users is NOT active. Cleaning up orphan…');
  await admin.from('user_books').delete().eq('user_id', id);
  await admin.from('users').delete().eq('id', id);
}
console.log('\nDone.');
