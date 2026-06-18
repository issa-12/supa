// =============================================================
// Sample-data seeder for live testing.
//   node seed-data.mjs          # seed
//   node seed-data.mjs --clean  # remove seed data only
//
// Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from backend/.env.
// Idempotent: re-running wipes the seed users' dependent rows first.
// All seed accounts use password: SeedPass123!
// =============================================================
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// ── load env ──────────────────────────────────────────────────
const env = {};
for (const line of readFileSync(new URL('./.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) { console.error('Missing SUPABASE_URL / SERVICE_ROLE_KEY'); process.exit(1); }

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = 'SeedPass123!';
const SEED_USERS = [
  { key: 'aria',  email: 'aria.reader.seed@gmail.com',  name: 'Aria Bennett',  bio: 'Fantasy & sci-fi devourer.', private: false },
  { key: 'leo',   email: 'leo.reads.seed@gmail.com',    name: 'Leo Castellano', bio: 'Classic literature only.',  private: false },
  { key: 'mia',   email: 'mia.pages.seed@gmail.com',    name: 'Mia Okafor',     bio: 'Thriller addict.',          private: false },
  { key: 'noah',  email: 'noah.books.seed@gmail.com',   name: 'Noah Park',      bio: 'Casual reader.',            private: true  },
  { key: 'zoe',   email: 'zoe.shelf.seed@gmail.com',    name: 'Zoe Hartman',    bio: 'Romance & poetry.',         private: false },
];

const BOOKS = [
  { g: 'pD6arNyKyi8C', title: 'The Hobbit',            author: 'J.R.R. Tolkien',    desc: 'Bilbo Baggins is swept into an epic quest to reclaim a treasure guarded by a dragon.', pages: 310, cover: 'https://books.google.com/books/content?id=pD6arNyKyi8C&printsec=frontcover&img=1&zoom=1' },
  { g: 'kotPYEqx7kMC', title: '1984',                  author: 'George Orwell',     desc: 'A dystopian tale of surveillance and totalitarian control.', pages: 328, cover: 'https://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1' },
  { g: 'B1hSG45JCX4C', title: 'Dune',                  author: 'Frank Herbert',     desc: 'A desert planet, a noble family, and the spice that controls the universe.', pages: 412, cover: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1' },
  { g: 'iXn5U2IzVH0C', title: 'The Great Gatsby',      author: 'F. Scott Fitzgerald', desc: 'Jay Gatsby and the American dream in the Jazz Age.', pages: 180, cover: 'https://books.google.com/books/content?id=iXn5U2IzVH0C&printsec=frontcover&img=1&zoom=1' },
  { g: 'PGR2AwAAQBAJ', title: 'To Kill a Mockingbird', author: 'Harper Lee',        desc: 'A story of racial injustice in the American South.', pages: 281, cover: 'https://books.google.com/books/content?id=PGR2AwAAQBAJ&printsec=frontcover&img=1&zoom=1' },
  { g: 'wrOQLV6xB-wC', title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', desc: 'A boy discovers he is a wizard on his eleventh birthday.', pages: 309, cover: 'https://books.google.com/books/content?id=wrOQLV6xB-wC&printsec=frontcover&img=1&zoom=1' },
  { g: 'yl4dILkcqm4C', title: 'The Hunger Games',      author: 'Suzanne Collins',   desc: 'A televised fight to the death in a dystopian nation.', pages: 374, cover: 'https://books.google.com/books/content?id=yl4dILkcqm4C&printsec=frontcover&img=1&zoom=1' },
  { g: 's1gVAAAAYAAJ', title: 'Pride and Prejudice',   author: 'Jane Austen',       desc: 'Elizabeth Bennet navigates love, class, and misunderstanding.', pages: 279, cover: 'https://books.google.com/books/content?id=s1gVAAAAYAAJ&printsec=frontcover&img=1&zoom=1' },
];

const log = (...a) => console.log(...a);

// Resolve a user id by email from public.users (admin.listUsers is flaky —
// returns a GoTrue 500 "Database error finding users" on this project).
async function findUserIdByEmail(email) {
  const { data } = await admin.from('users').select('id').eq('email', email.toLowerCase()).maybeSingle();
  return data?.id ?? null;
}

async function resolveSeedUserIds() {
  const ids = {};
  for (const u of SEED_USERS) ids[u.key] = await findUserIdByEmail(u.email);
  return ids;
}

async function clean(ids) {
  const list = Object.values(ids).filter(Boolean);
  if (!list.length) { log('Nothing to clean.'); return; }
  log(`Cleaning dependent rows for ${list.length} seed users…`);
  // Children first.
  const { data: postRows } = await admin.from('posts').select('post_id').in('user_id', list);
  const postIds = (postRows ?? []).map((r) => r.post_id);
  const { data: cmtRows } = await admin.from('comments').select('comment_id').in('user_id', list);
  const cmtIds = (cmtRows ?? []).map((r) => r.comment_id);
  if (cmtIds.length) await admin.from('comment_likes').delete().in('comment_id', cmtIds);
  if (postIds.length) await admin.from('post_likes').delete().in('post_id', postIds);
  await admin.from('comment_likes').delete().in('user_id', list);
  await admin.from('post_likes').delete().in('user_id', list);
  await admin.from('comments').delete().in('user_id', list);
  await admin.from('posts').delete().in('user_id', list);
  await admin.from('user_books').delete().in('user_id', list);
  await admin.from('user_genres').delete().in('user_id', list);
  await admin.from('reading_goals').delete().in('user_id', list);
  await admin.from('friendship').delete().or(list.map((id) => `user_id1.eq.${id},user_id2.eq.${id}`).join(','));
  await admin.from('notifications').delete().in('user_id', list);
  await admin.from('notifications').delete().in('actor_user_id', list);
}

async function deleteSeedUsersCompletely(ids) {
  await clean(ids);
  for (const [key, id] of Object.entries(ids)) {
    if (!id) continue;
    await admin.from('users').delete().eq('id', id);
    await admin.auth.admin.deleteUser(id).catch(() => {});
    log(`  deleted ${key}`);
  }
}

async function getOrCreateUser(u) {
  // If we already have them in public.users, just refresh the password/metadata.
  const existingId = await findUserIdByEmail(u.email);
  if (existingId) {
    await admin.auth.admin.updateUserById(existingId, {
      password: PASSWORD, user_metadata: { name: u.name, app_email_verified: true },
    }).catch(() => {});
    return existingId;
  }
  const { data: created, error } = await admin.auth.admin.createUser({
    email: u.email, password: PASSWORD, email_confirm: true,
    user_metadata: { name: u.name, app_email_verified: true },
  });
  if (created?.user) return created.user.id;
  throw error ?? new Error(`Cannot resolve user ${u.email}`);
}

async function main() {
  const cleanOnly = process.argv.includes('--clean');

  // Reference data
  const { data: statuses } = await admin.from('reading_statuses').select('status_id, status_name');
  const SID = Object.fromEntries((statuses ?? []).map((s) => [s.status_name, s.status_id]));
  const { data: fstatuses } = await admin.from('friendship_status').select('status_id, status_name');
  const FID = Object.fromEntries((fstatuses ?? []).map((s) => [s.status_name, s.status_id]));
  const { data: genres } = await admin.from('genres').select('genre_id, genre_name');

  if (cleanOnly) {
    const ids = await resolveSeedUserIds();
    await deleteSeedUsersCompletely(ids);
    log('\n✅ Seed data removed.');
    return;
  }

  // 1. Users
  const ids = {};
  for (const u of SEED_USERS) {
    ids[u.key] = await getOrCreateUser(u);
    await admin.from('users').upsert({
      id: ids[u.key], email: u.email.toLowerCase(), name: u.name, about_me: u.bio,
      verified: true, is_private: u.private, updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    await admin.from('profiles').upsert({ user_id: ids[u.key], name: u.name }, { onConflict: 'user_id' }).then(() => {}, () => {});
    log(`User ${u.name} (${u.key}) → ${ids[u.key]}`);
  }

  // Fresh slate for dependent rows.
  await clean(ids);

  // 2. Genres per user (3 each, varied)
  for (let i = 0; i < SEED_USERS.length; i++) {
    const picks = (genres ?? []).slice(i, i + 3);
    for (const g of picks) {
      await admin.from('user_genres').insert({ user_id: ids[SEED_USERS[i].key], genre_id: g.genre_id }).then(() => {}, () => {});
    }
  }

  // 3. Books
  const bookIds = {};
  for (const b of BOOKS) {
    const { data: existing } = await admin.from('books').select('book_id').eq('google_books_id', b.g).maybeSingle();
    if (existing) { bookIds[b.g] = existing.book_id; continue; }
    const { data: ins, error } = await admin.from('books').insert({
      title: b.title, author_name: b.author, description: b.desc,
      cover_image_url: b.cover, google_books_id: b.g,
    }).select('book_id').single();
    if (error) { log('book insert err', b.title, error.message); continue; }
    bookIds[b.g] = ins.book_id;
  }
  log(`Books ready: ${Object.keys(bookIds).length}`);

  // 4. user_books — varied statuses/ratings/reviews/progress
  const ub = (userKey, g, status, extra = {}) => ({
    user_id: ids[userKey], book_id: bookIds[g], status_id: SID[status],
    added_at: new Date(Date.now() - Math.random() * 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(), ...extra,
  });
  const shelf = [
    ub('aria', 'pD6arNyKyi8C', 'read', { rating: 5, review_text: 'An absolute classic. Tolkien at his most charming.' }),
    ub('aria', 'B1hSG45JCX4C', 'read', { rating: 4, review_text: 'Dense but rewarding world-building.' }),
    ub('aria', 'wrOQLV6xB-wC', 'currently_reading', { current_page: 120, total_pages: 309 }),
    ub('aria', 'yl4dILkcqm4C', 'want_to_read'),
    ub('leo',  'iXn5U2IzVH0C', 'read', { rating: 5, review_text: 'The prose is unmatched. A perfect novel.' }),
    ub('leo',  's1gVAAAAYAAJ', 'read', { rating: 4, review_text: 'Witty and sharp.' }),
    ub('leo',  'kotPYEqx7kMC', 'currently_reading', { current_page: 80, total_pages: 328 }),
    ub('mia',  'kotPYEqx7kMC', 'read', { rating: 5, review_text: 'Terrifying and brilliant.' }),
    ub('mia',  'PGR2AwAAQBAJ', 'read', { rating: 4 }),
    ub('mia',  'yl4dILkcqm4C', 'currently_reading', { current_page: 200, total_pages: 374 }),
    ub('noah', 'pD6arNyKyi8C', 'want_to_read'),
    ub('noah', 'iXn5U2IzVH0C', 'read', { rating: 3, review_text: 'Good, a bit overrated for me.' }),
    ub('zoe',  's1gVAAAAYAAJ', 'read', { rating: 5, review_text: 'Re-read it every year. Pure comfort.' }),
    ub('zoe',  'B1hSG45JCX4C', 'want_to_read'),
    ub('zoe',  'wrOQLV6xB-wC', 'read', { rating: 5 }),
  ];
  for (const row of shelf) {
    if (!row.book_id || !row.status_id) continue;
    await admin.from('user_books').upsert(row, { onConflict: 'user_id,book_id' });
  }
  log(`Shelf rows: ${shelf.length}`);

  // 5. Friendships (accepted): aria↔leo, aria↔mia, aria↔zoe, leo↔mia ; pending noah→aria
  const friend = async (a, b, status, requester) => {
    await admin.from('friendship').insert({
      user_id1: ids[a], user_id2: ids[b], status_id: FID[status], requester_id: ids[requester],
    }).then(() => {}, (e) => log('friendship err', e.message));
  };
  await friend('aria', 'leo', 'accepted', 'aria');
  await friend('aria', 'mia', 'accepted', 'mia');
  await friend('aria', 'zoe', 'accepted', 'aria');
  await friend('leo', 'mia', 'accepted', 'leo');
  await friend('noah', 'aria', 'pending', 'noah');
  log('Friendships created');

  // 6. Reading goals
  const year = new Date().getFullYear();
  for (const k of ['aria', 'leo', 'mia', 'zoe']) {
    await admin.from('reading_goals').upsert({ user_id: ids[k], year, target_books: 24 }, { onConflict: 'user_id,year' }).then(() => {}, () => {});
  }

  // 7. Posts (moderation_status approved — these are clean) + comments + likes
  const mkPost = async (userKey, g, content, tags, sentiment) => {
    const { data, error } = await admin.from('posts').insert({
      user_id: ids[userKey], book_id: bookIds[g], content, tags, sentiment,
      moderation_status: 'approved', is_deleted: false,
    }).select('post_id').single();
    if (error) { log('post err', error.message); return null; }
    return data.post_id;
  };
  const p1 = await mkPost('aria', 'pD6arNyKyi8C', 'Just finished The Hobbit for the third time and it never gets old! 🐉', ['fantasy', 'classics'], 'positive');
  const p2 = await mkPost('leo', 'iXn5U2IzVH0C', 'Hot take: Gatsby is the great American novel and nothing comes close.', ['classics'], 'positive');
  const p3 = await mkPost('mia', 'kotPYEqx7kMC', '1984 hits different in 2026. Required reading.', ['dystopia'], 'mixed');

  const mkComment = async (userKey, postId, content, parent = null, depth = 0) => {
    if (!postId) return null;
    const { data, error } = await admin.from('comments').insert({
      post_id: postId, user_id: ids[userKey], content, parent_comment_id: parent, depth, is_deleted: false,
    }).select('comment_id').single();
    if (error) { log('comment err', error.message); return null; }
    return data.comment_id;
  };
  const c1 = await mkComment('leo', p1, 'Totally agree, the prose is so cozy.');
  await mkComment('aria', p1, 'Right? Bilbo is the best.', c1, 1);
  await mkComment('mia', p2, 'Bold claim but I respect it.');

  const like = async (userKey, postId) => { if (postId) await admin.from('post_likes').insert({ post_id: postId, user_id: ids[userKey] }).then(() => {}, () => {}); };
  await like('leo', p1); await like('mia', p1); await like('zoe', p1);
  await like('aria', p2); await like('mia', p2);
  log('Posts/comments/likes created');

  log('\n✅ Seed complete.');
  log('Login at https://localhost:8443 with any of:');
  for (const u of SEED_USERS) log(`   ${u.email}  /  ${PASSWORD}${u.private ? '  (private account)' : ''}`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
