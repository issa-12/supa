-- =============================================================
-- ReadTrack -- DEV-ONLY Community Seed Data
-- 5 test users + 10 books + 15 posts + likes + shelves
--
-- WARNING: Creates 5 auth users with the well-known password
--   "ReadTrack2026!" baked in. DO NOT run on production.
--
-- Lives in supabase/seed-dev/ (NOT supabase/migrations/) so the
-- Supabase CLI migration runner will not auto-apply it.
-- Run manually in the Supabase Dashboard SQL Editor for local dev.
--
-- Safe to re-run (all inserts use ON CONFLICT DO NOTHING).
-- =============================================================

-- Safety guard: refuses to run unless the session explicitly opts in.
-- Before executing this script, run in the same session:
--   SET LOCAL app.seed_dev = 'allow';
DO $$
BEGIN
  IF coalesce(current_setting('app.seed_dev', true), '') <> 'allow' THEN
    RAISE EXCEPTION
      'Refusing to run dev seed. Run "SET LOCAL app.seed_dev = ''allow'';" first if this is dev.';
  END IF;
END;
$$;

-- ── 1. Test auth users ────────────────────────────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role,
  email, encrypted_password,
  email_confirmed_at, confirmation_sent_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  is_super_admin, is_sso_user, is_anonymous
)
VALUES
  (
    'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'alice@readtrack.dev', crypt('ReadTrack2026!', gen_salt('bf')),
    now(), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Alice Reader"}',
    false, false, false
  ),
  (
    'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'bob@readtrack.dev', crypt('ReadTrack2026!', gen_salt('bf')),
    now(), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Bob Bookworm"}',
    false, false, false
  ),
  (
    'cccccccc-0003-0003-0003-cccccccccccc',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'clara@readtrack.dev', crypt('ReadTrack2026!', gen_salt('bf')),
    now(), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Clara Pages"}',
    false, false, false
  ),
  (
    'dddddddd-0004-0004-0004-dddddddddddd',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'dan@readtrack.dev', crypt('ReadTrack2026!', gen_salt('bf')),
    now(), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Dan Chapters"}',
    false, false, false
  ),
  (
    'eeeeeeee-0005-0005-0005-eeeeeeeeeeee',
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    'eva@readtrack.dev', crypt('ReadTrack2026!', gen_salt('bf')),
    now(), now(), now(), now(),
    '{"provider":"email","providers":["email"]}', '{"name":"Eva Stories"}',
    false, false, false
  )
ON CONFLICT (id) DO NOTHING;

-- ── 2. Public user profiles ───────────────────────────────────

INSERT INTO public.users (id, email, name, username, about_me, created_at, updated_at)
VALUES
  ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', 'alice@readtrack.dev',  'Alice Reader',  'alice_reads',  'Lover of literary fiction and cozy mysteries.',        now() - interval '30 days', now()),
  ('bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', 'bob@readtrack.dev',    'Bob Bookworm',  'bob_bookworm', 'Sci-fi nerd and fantasy enthusiast. Always reading.',  now() - interval '25 days', now()),
  ('cccccccc-0003-0003-0003-cccccccccccc', 'clara@readtrack.dev',  'Clara Pages',   'clara_pages',  'Historical fiction and biographies. Coffee lover.',    now() - interval '20 days', now()),
  ('dddddddd-0004-0004-0004-dddddddddddd', 'dan@readtrack.dev',    'Dan Chapters',  'dan_chapters', 'Thriller junkie. If it keeps me up at night, I love it.', now() - interval '15 days', now()),
  ('eeeeeeee-0005-0005-0005-eeeeeeeeeeee', 'eva@readtrack.dev',    'Eva Stories',   'eva_stories',  'Romance and YA reader. Happily ever after is a lifestyle.', now() - interval '10 days', now())
ON CONFLICT (id) DO NOTHING;

-- ── 3. Genre preferences ──────────────────────────────────────

INSERT INTO public.user_genres (user_id, genre_id)
SELECT 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', genre_id
FROM public.genres WHERE genre_name IN ('Literary Fiction', 'Mystery & Thriller')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_genres (user_id, genre_id)
SELECT 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', genre_id
FROM public.genres WHERE genre_name IN ('Science Fiction', 'Fantasy')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_genres (user_id, genre_id)
SELECT 'cccccccc-0003-0003-0003-cccccccccccc', genre_id
FROM public.genres WHERE genre_name IN ('Historical Fiction', 'Biography')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_genres (user_id, genre_id)
SELECT 'dddddddd-0004-0004-0004-dddddddddddd', genre_id
FROM public.genres WHERE genre_name IN ('Mystery & Thriller', 'Horror')
ON CONFLICT DO NOTHING;

INSERT INTO public.user_genres (user_id, genre_id)
SELECT 'eeeeeeee-0005-0005-0005-eeeeeeeeeeee', genre_id
FROM public.genres WHERE genre_name IN ('Romance', 'Young Adult')
ON CONFLICT DO NOTHING;

-- ── 4. Books (only known-safe columns) ───────────────────────

INSERT INTO public.books (title, author_name, cover_image_url, google_books_id)
VALUES
  ('The Great Gatsby',                      'F. Scott Fitzgerald', 'https://covers.openlibrary.org/b/id/8432503-L.jpg',   'h1UotAAACAAJ'),
  ('To Kill a Mockingbird',                 'Harper Lee',          'https://covers.openlibrary.org/b/id/8228691-L.jpg',   '0T1BAQAAQBAJ'),
  ('1984',                                  'George Orwell',       'https://covers.openlibrary.org/b/id/8575708-L.jpg',   '_aYeAAAAMAAJ'),
  ('Harry Potter and the Philosopher Stone','J.K. Rowling',        'https://covers.openlibrary.org/b/id/10110415-L.jpg',  'wrOQLV6xB-wC'),
  ('The Hitchhikers Guide to the Galaxy',  'Douglas Adams',       'https://covers.openlibrary.org/b/id/8691715-L.jpg',   'W-xMPgAACAAJ'),
  ('Gone Girl',                             'Gillian Flynn',       'https://covers.openlibrary.org/b/id/8224519-L.jpg',   'btkBnwEACAAJ'),
  ('Sapiens A Brief History of Humankind',  'Yuval Noah Harari',   'https://covers.openlibrary.org/b/id/9163850-L.jpg',   '1EiJAwAAQBAJ'),
  ('The Name of the Wind',                  'Patrick Rothfuss',    'https://covers.openlibrary.org/b/id/8704703-L.jpg',   'BEBLUlwbgB8C'),
  ('Pride and Prejudice',                   'Jane Austen',         'https://covers.openlibrary.org/b/id/10306750-L.jpg',  'gnmZAAAAMAAJ'),
  ('The Midnight Library',                  'Matt Haig',           'https://covers.openlibrary.org/b/id/10521866-L.jpg',  'n5QQEAAAQBAJ')
ON CONFLICT (google_books_id) DO UPDATE
  SET title = EXCLUDED.title,
      author_name = EXCLUDED.author_name;

-- ── 5. Posts (dollar-quoting avoids all apostrophe issues) ────

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', book_id,
  $q$Just finished The Great Gatsby for the third time and I still cannot get over the green light metaphor. Fitzgerald's writing is pure poetry. The whole novel feels like a fever dream of the American Dream crumbling. Absolutely timeless.$q$,
  ARRAY['classics','literary','americandream','mustread'],
  'positive', 'approved', false, now() - interval '6 days'
FROM public.books WHERE google_books_id = 'h1UotAAACAAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', book_id,
  $q$1984 keeps getting more relevant every year and that terrifies me. The concept of doublethink is literally happening in daily news. Orwell was a prophet. Required reading for everyone, no exceptions.$q$,
  ARRAY['scifi','dystopia','classics','political','mustread'],
  'negative', 'approved', false, now() - interval '5 days 12 hours'
FROM public.books WHERE google_books_id = '_aYeAAAAMAAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'cccccccc-0003-0003-0003-cccccccccccc', book_id,
  $q$Sapiens completely changed how I think about civilization, money, and religion. The chapter on the Agricultural Revolution blew my mind. Were we really happier as hunter-gatherers? I have been recommending this to everyone I know.$q$,
  ARRAY['nonfiction','history','science','mindblowing','biography'],
  'positive', 'approved', false, now() - interval '5 days'
FROM public.books WHERE google_books_id = '1EiJAwAAQBAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'dddddddd-0004-0004-0004-dddddddddddd', book_id,
  $q$Gone Girl had me guessing until the last page. Nick or Amy? Amy or Nick? Flynn is a genius at making you root for the wrong person. The twist absolutely destroyed me. Thriller lovers, this is non-negotiable.$q$,
  ARRAY['thriller','mystery','pageturner','twisty','crime'],
  'mixed', 'approved', false, now() - interval '4 days 8 hours'
FROM public.books WHERE google_books_id = 'btkBnwEACAAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'eeeeeeee-0005-0005-0005-eeeeeeeeeeee', book_id,
  $q$The Midnight Library made me sob at 2am. The idea that every choice leads to a different life is both comforting and devastating. Matt Haig writes about mental health with such gentleness and honesty. This one will stay with me forever.$q$,
  ARRAY['contemporary','mentalhealth','emotional','hopeful','mustread'],
  'positive', 'approved', false, now() - interval '4 days'
FROM public.books WHERE google_books_id = 'n5QQEAAAQBAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', book_id,
  $q$Unpopular opinion: To Kill a Mockingbird is overrated. I know, I know. The moral message is important but the pacing drags so much in the middle. Atticus Finch is a great character but the story felt slow. 3 out of 5 stars from me.$q$,
  ARRAY['classics','controversial','literary','southerngothic'],
  'negative', 'approved', false, now() - interval '3 days 16 hours'
FROM public.books WHERE google_books_id = '0T1BAQAAQBAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', book_id,
  $q$The Name of the Wind is possibly the most beautifully written fantasy I have ever read. Rothfuss uses language like a musician, every sentence has a rhythm. Seven years into the wait for Doors of Stone and I would wait seven more.$q$,
  ARRAY['fantasy','epicfantasy','magic','worldbuilding','kingkiller'],
  'positive', 'approved', false, now() - interval '3 days'
FROM public.books WHERE google_books_id = 'BEBLUlwbgB8C';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'cccccccc-0003-0003-0003-cccccccccccc', book_id,
  $q$Pride and Prejudice is the original enemies-to-lovers story and nothing has topped it in 200 years. Elizabeth Bennet is one of the greatest heroines in all of fiction. Darcy wrote her a letter. A letter! Modern men could never.$q$,
  ARRAY['romance','classics','janeausten','historicalfiction','enemiestolovers'],
  'positive', 'approved', false, now() - interval '2 days 20 hours'
FROM public.books WHERE google_books_id = 'gnmZAAAAMAAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'dddddddd-0004-0004-0004-dddddddddddd', book_id,
  $q$The Hitchhikers Guide to the Galaxy is pure comedic genius. The answer to life, the universe, and everything is 42. That might be the most perfectly absurd punchline ever written. Adams had a brain unlike anyone else. Miss him dearly.$q$,
  ARRAY['scifi','comedy','humour','spacetravel','cult'],
  'positive', 'approved', false, now() - interval '2 days'
FROM public.books WHERE google_books_id = 'W-xMPgAACAAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'eeeeeeee-0005-0005-0005-eeeeeeeeeeee', book_id,
  $q$I re-read Harry Potter every year and I do not care what anyone thinks. The world-building is unmatched, the friendships feel real, and Diagon Alley still makes me nostalgic for a place I have never been. Forever a Hufflepuff.$q$,
  ARRAY['fantasy','harrypotter','magic','reread','nostalgic'],
  'positive', 'approved', false, now() - interval '1 day 12 hours'
FROM public.books WHERE google_books_id = 'wrOQLV6xB-wC';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', book_id,
  $q$Sapiens vs Homo Deus, which Harari do you prefer? I think Sapiens is more grounded but Homo Deus is the scarier and more thought-provoking read. Either way, prepare to question everything you think you know about humanity.$q$,
  ARRAY['nonfiction','philosophy','history','science','yuvalnoahharari'],
  'neutral', 'approved', false, now() - interval '1 day'
FROM public.books WHERE google_books_id = '1EiJAwAAQBAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', book_id,
  $q$Does anyone else feel like 1984 is too depressing to reread? I loved it but I genuinely felt anxious for days after finishing. Orwell did his job almost too well. The ending absolutely wrecked me.$q$,
  ARRAY['dystopia','classics','darkread','scifi','thoughtprovoking'],
  'negative', 'approved', false, now() - interval '18 hours'
FROM public.books WHERE google_books_id = '_aYeAAAAMAAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'cccccccc-0003-0003-0003-cccccccccccc', book_id,
  $q$Gone Girl is a masterpiece of unreliable narration. I read it in one sitting and then immediately reread the first chapter to see all the clues I missed. Flynn plants everything perfectly. If you love psychological thrillers, run do not walk.$q$,
  ARRAY['thriller','psychological','crime','mustread','pageturner'],
  'positive', 'approved', false, now() - interval '12 hours'
FROM public.books WHERE google_books_id = 'btkBnwEACAAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'dddddddd-0004-0004-0004-dddddddddddd', book_id,
  $q$The Midnight Library tackles depression and regret in such a beautiful way. Nora's journey through the lives she could have lived hit me differently at 3am. Highly recommend for anyone going through a difficult season.$q$,
  ARRAY['contemporary','mentalhealth','emotional','selfhelp','hopeful'],
  'positive', 'approved', false, now() - interval '6 hours'
FROM public.books WHERE google_books_id = 'n5QQEAAAQBAJ';

INSERT INTO public.posts (user_id, book_id, content, tags, sentiment, moderation_status, is_deleted, created_at)
SELECT 'eeeeeeee-0005-0005-0005-eeeeeeeeeeee', book_id,
  $q$The Great Gatsby is the most misunderstood novel in the American high school curriculum. Everyone focuses on Gatsby and Daisy but the real heart is Nick's growing disillusionment. It is a tragedy about loneliness, not wealth.$q$,
  ARRAY['classics','literary','americandream','analysis','school'],
  'mixed', 'approved', false, now() - interval '2 hours'
FROM public.books WHERE google_books_id = 'h1UotAAACAAJ';

-- ── 6. Post likes (simple, readable) ─────────────────────────

DO $$
DECLARE
  v_post_ids INT[];
BEGIN
  SELECT ARRAY(
    SELECT post_id FROM public.posts
    WHERE user_id IN (
      'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa',
      'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb',
      'cccccccc-0003-0003-0003-cccccccccccc',
      'dddddddd-0004-0004-0004-dddddddddddd',
      'eeeeeeee-0005-0005-0005-eeeeeeeeeeee'
    )
    AND is_deleted = false
  ) INTO v_post_ids;

  -- Alice likes posts by bob, clara, dan, eva
  INSERT INTO public.post_likes (post_id, user_id)
  SELECT p.post_id, 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa'
  FROM public.posts p
  WHERE p.user_id IN ('bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb','cccccccc-0003-0003-0003-cccccccccccc','dddddddd-0004-0004-0004-dddddddddddd')
    AND p.is_deleted = false
  ON CONFLICT DO NOTHING;

  -- Bob likes posts by alice, clara, eva
  INSERT INTO public.post_likes (post_id, user_id)
  SELECT p.post_id, 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb'
  FROM public.posts p
  WHERE p.user_id IN ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa','cccccccc-0003-0003-0003-cccccccccccc','eeeeeeee-0005-0005-0005-eeeeeeeeeeee')
    AND p.is_deleted = false
  ON CONFLICT DO NOTHING;

  -- Clara likes posts by bob, dan, eva
  INSERT INTO public.post_likes (post_id, user_id)
  SELECT p.post_id, 'cccccccc-0003-0003-0003-cccccccccccc'
  FROM public.posts p
  WHERE p.user_id IN ('bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb','dddddddd-0004-0004-0004-dddddddddddd','eeeeeeee-0005-0005-0005-eeeeeeeeeeee')
    AND p.is_deleted = false
  ON CONFLICT DO NOTHING;

  -- Dan likes posts by alice, clara
  INSERT INTO public.post_likes (post_id, user_id)
  SELECT p.post_id, 'dddddddd-0004-0004-0004-dddddddddddd'
  FROM public.posts p
  WHERE p.user_id IN ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa','cccccccc-0003-0003-0003-cccccccccccc')
    AND p.is_deleted = false
  ON CONFLICT DO NOTHING;

  -- Eva likes posts by alice, bob, dan
  INSERT INTO public.post_likes (post_id, user_id)
  SELECT p.post_id, 'eeeeeeee-0005-0005-0005-eeeeeeeeeeee'
  FROM public.posts p
  WHERE p.user_id IN ('aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa','bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb','dddddddd-0004-0004-0004-dddddddddddd')
    AND p.is_deleted = false
  ON CONFLICT DO NOTHING;
END;
$$;

-- ── 7. User shelves ───────────────────────────────────────────

INSERT INTO public.user_books (user_id, book_id, status_id, rating, added_at, updated_at)
SELECT 'aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa', b.book_id, rs.status_id,
  CASE b.google_books_id WHEN 'h1UotAAACAAJ' THEN 5 WHEN '0T1BAQAAQBAJ' THEN 3 ELSE 4 END,
  now() - interval '20 days', now()
FROM public.books b, public.reading_statuses rs
WHERE b.google_books_id IN ('h1UotAAACAAJ','0T1BAQAAQBAJ','n5QQEAAAQBAJ')
  AND rs.status_name = 'read'
ON CONFLICT (user_id, book_id) DO NOTHING;

INSERT INTO public.user_books (user_id, book_id, status_id, rating, added_at, updated_at)
SELECT 'bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb', b.book_id, rs.status_id,
  CASE b.google_books_id WHEN '_aYeAAAAMAAJ' THEN 5 WHEN 'BEBLUlwbgB8C' THEN 5 ELSE 4 END,
  now() - interval '18 days', now()
FROM public.books b, public.reading_statuses rs
WHERE b.google_books_id IN ('_aYeAAAAMAAJ','BEBLUlwbgB8C','W-xMPgAACAAJ','1EiJAwAAQBAJ')
  AND rs.status_name = 'read'
ON CONFLICT (user_id, book_id) DO NOTHING;

INSERT INTO public.user_books (user_id, book_id, status_id, rating, added_at, updated_at)
SELECT 'cccccccc-0003-0003-0003-cccccccccccc', b.book_id, rs.status_id,
  CASE b.google_books_id WHEN '1EiJAwAAQBAJ' THEN 5 WHEN 'gnmZAAAAMAAJ' THEN 5 ELSE 4 END,
  now() - interval '15 days', now()
FROM public.books b, public.reading_statuses rs
WHERE b.google_books_id IN ('1EiJAwAAQBAJ','gnmZAAAAMAAJ','btkBnwEACAAJ')
  AND rs.status_name = 'read'
ON CONFLICT (user_id, book_id) DO NOTHING;

INSERT INTO public.user_books (user_id, book_id, status_id, rating, added_at, updated_at)
SELECT 'dddddddd-0004-0004-0004-dddddddddddd', b.book_id, rs.status_id,
  CASE b.google_books_id WHEN 'btkBnwEACAAJ' THEN 5 WHEN 'W-xMPgAACAAJ' THEN 4 ELSE 3 END,
  now() - interval '12 days', now()
FROM public.books b, public.reading_statuses rs
WHERE b.google_books_id IN ('btkBnwEACAAJ','W-xMPgAACAAJ','_aYeAAAAMAAJ')
  AND rs.status_name = 'read'
ON CONFLICT (user_id, book_id) DO NOTHING;

INSERT INTO public.user_books (user_id, book_id, status_id, rating, added_at, updated_at)
SELECT 'eeeeeeee-0005-0005-0005-eeeeeeeeeeee', b.book_id, rs.status_id,
  CASE b.google_books_id WHEN 'n5QQEAAAQBAJ' THEN 5 WHEN 'wrOQLV6xB-wC' THEN 5 ELSE 4 END,
  now() - interval '8 days', now()
FROM public.books b, public.reading_statuses rs
WHERE b.google_books_id IN ('n5QQEAAAQBAJ','wrOQLV6xB-wC','gnmZAAAAMAAJ')
  AND rs.status_name = 'read'
ON CONFLICT (user_id, book_id) DO NOTHING;

-- =============================================================
-- Test credentials:  email: alice/bob/clara/dan/eva @readtrack.dev
--                  password: ReadTrack2026!
-- =============================================================
