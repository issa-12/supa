import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = {};
for (const line of readFileSync(new URL('./.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let fail = 0;
const ok = (label, pass, extra = '') => { console.log(`${pass ? '✅' : '❌'} ${label}${extra ? ' — ' + extra : ''}`); if (!pass) fail++; };

// 1. Every table the app reads/writes is reachable
const tables = ['users','profiles','books','user_books','reading_statuses','reading_goals','genres','user_genres','posts','comments','post_likes','comment_likes','review_likes','friendship','friendship_status','notifications','notifications_type','ai_recommendations','user_reports'];
for (const t of tables) {
  const { error } = await sb.from(t).select('*', { head: true, count: 'exact' }).limit(1);
  ok(`table ${t}`, !error, error?.message);
}

// 2. New columns present
ok('users.is_private', !(await sb.from('users').select('is_private').limit(1)).error);
ok('users.last_seen_at', !(await sb.from('users').select('last_seen_at').limit(1)).error);
ok('user_books.recommended_by', !(await sb.from('user_books').select('recommended_by').limit(1)).error);
ok('user_books.review_text/current_page', !(await sb.from('user_books').select('review_text, current_page, total_pages, note').limit(1)).error);

// 3. Seeds
const rs = (await sb.from('reading_statuses').select('status_name')).data?.map(r => r.status_name) ?? [];
ok('reading_statuses seed', ['read','want_to_read','currently_reading','recommended_by_friend'].every(s => rs.includes(s)), rs.join(','));
const fs = (await sb.from('friendship_status').select('status_name')).data?.map(r => r.status_name) ?? [];
ok('friendship_status seed', ['pending','accepted','rejected','blocked'].every(s => fs.includes(s)), fs.join(','));
const nt = (await sb.from('notifications_type').select('notifications_type')).data?.map(r => r.notifications_type) ?? [];
ok('notif types seed', ['friend_request','friend_accepted','book_recommended','post_liked','comment_liked','review_liked','post_commented','comment_replied'].every(s => nt.includes(s)), `${nt.length} types`);
const gc = (await sb.from('genres').select('genre_id', { head: true, count: 'exact' })).count ?? 0;
ok('genres seeded', gc >= 20, `${gc} genres`);

// 4. Stats RPCs callable
const since = new Date(Date.now() - 7 * 864e5).toISOString();
ok('rpc stats_top_books', !(await sb.rpc('stats_top_books', { since })).error);
ok('rpc stats_trending_genres', !(await sb.rpc('stats_trending_genres')).error);
const readId = (await sb.from('reading_statuses').select('status_id').eq('status_name','read').single()).data?.status_id;
ok('rpc stats_top_readers', !(await sb.rpc('stats_top_readers', { read_status_id: readId })).error);

// 5. Community feed filter (private + flagged exclusion) runs without error
ok('community feed filter', !(await sb.from('posts').select('post_id').neq('is_deleted', true)
  .or('moderation_status.is.null,and(moderation_status.neq.rejected,moderation_status.neq.flagged)')).error);

console.log(fail === 0 ? '\n=== SMOKE: ALL DATA-LAYER CHECKS PASSED ===' : `\n=== SMOKE: ${fail} FAILURE(S) ===`);
process.exit(fail === 0 ? 0 : 1);
