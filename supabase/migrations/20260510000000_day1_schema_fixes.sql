-- =============================================================
-- ReadTrack — Day 1 Schema Migration
-- Fixes critical issues + seeds reference tables + adds indexes + RLS
-- =============================================================

-- ── 1. user_books.note_id was NOT NULL ────────────────────────
ALTER TABLE public.user_books ALTER COLUMN note_id DROP NOT NULL;

-- ── 2. books needs google_books_id ────────────────────────────
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS google_books_id VARCHAR UNIQUE;

-- ── 3. comments need threading support ────────────────────────
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER
    REFERENCES public.comments(comment_id) ON DELETE CASCADE;

ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0
    CHECK (depth >= 0 AND depth <= 3);

-- ── 4. notifications need a context reference ─────────────────
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_id INTEGER;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);

-- ── 5. friendship needs requester tracking ────────────────────
ALTER TABLE public.friendship
  ADD COLUMN IF NOT EXISTS requester_id UUID REFERENCES auth.users(id);

-- ── 6. profiles — add 2FA fields ──────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT false;

-- ── 7. prevent duplicate likes ────────────────────────────────
-- ADD CONSTRAINT IF NOT EXISTS is not valid PostgreSQL syntax;
-- unique indexes are equivalent and support IF NOT EXISTS.
CREATE UNIQUE INDEX IF NOT EXISTS post_likes_unique
  ON public.post_likes(post_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS comment_likes_unique
  ON public.comment_likes(comment_id, user_id);

-- ── 8. user_sessions double FK cleanup ────────────────────────
ALTER TABLE public.user_sessions
  DROP CONSTRAINT IF EXISTS fk_user_sessions_user_id;

-- ── 9. user_genres primary key ────────────────────────────────
-- DO block guards against re-running on an already-migrated DB.
DO $$
BEGIN
  ALTER TABLE public.user_genres ALTER COLUMN user_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN
  NULL;  -- already NOT NULL, skip
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_genres_pkey'
      AND conrelid = 'public.user_genres'::regclass
  ) THEN
    ALTER TABLE public.user_genres
      ADD CONSTRAINT user_genres_pkey PRIMARY KEY (user_id, genre_id);
  END IF;
END;
$$;

-- =============================================================
-- Seed reference tables
-- =============================================================

INSERT INTO public.reading_statuses (status_name)
VALUES
  ('read'),
  ('want_to_read'),
  ('currently_reading'),
  ('recommended_by_friend')
ON CONFLICT (status_name) DO NOTHING;

INSERT INTO public.friendship_status (status_name)
VALUES ('pending'), ('accepted'), ('rejected'), ('blocked')
ON CONFLICT (status_name) DO NOTHING;

INSERT INTO public.moderation_actions (action_name)
VALUES ('none'), ('flagged'), ('removed'), ('approved')
ON CONFLICT (action_name) DO NOTHING;

INSERT INTO public.notifications_type (notifications_type)
VALUES
  ('friend_request'),
  ('friend_accepted'),
  ('book_recommended'),
  ('post_liked'),
  ('comment_liked'),
  ('review_liked'),
  ('friend_posted')
ON CONFLICT DO NOTHING;

INSERT INTO public.language (language)
VALUES ('en'), ('ar'), ('fr')
ON CONFLICT DO NOTHING;

INSERT INTO public.genres (genre_name)
VALUES
  ('Fiction'),('Non-Fiction'),('Mystery & Thriller'),('Science Fiction'),
  ('Fantasy'),('Romance'),('Historical Fiction'),('Biography'),
  ('Self-Help'),('Horror'),('Literary Fiction'),('Graphic Novel'),
  ('Young Adult'),('Children'),('Psychology'),('Philosophy'),
  ('Science'),('Travel'),('Poetry'),('Art & Photography')
ON CONFLICT (genre_name) DO NOTHING;

-- =============================================================
-- Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_friendship_user1     ON public.friendship(user_id1);
CREATE INDEX IF NOT EXISTS idx_friendship_user2     ON public.friendship(user_id2);
CREATE INDEX IF NOT EXISTS idx_friendship_status    ON public.friendship(status_id);
CREATE INDEX IF NOT EXISTS idx_books_google_id      ON public.books(google_books_id);
CREATE INDEX IF NOT EXISTS idx_user_books_user      ON public.user_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_books_status    ON public.user_books(status_id);
CREATE INDEX IF NOT EXISTS idx_user_books_book      ON public.user_books(book_id);
CREATE INDEX IF NOT EXISTS idx_posts_user           ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created        ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post        ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent      ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read_status);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag        ON public.post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_users_username       ON public.users(username);

-- =============================================================
-- Row Level Security
-- =============================================================

-- ── users ─────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_select" ON public.users
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ── genres ────────────────────────────────────────────────────
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "genres_select" ON public.genres;
CREATE POLICY "genres_select" ON public.genres
  FOR SELECT TO authenticated USING (true);

-- ── user_genres ───────────────────────────────────────────────
ALTER TABLE public.user_genres ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_genres_select" ON public.user_genres;
DROP POLICY IF EXISTS "user_genres_insert" ON public.user_genres;
DROP POLICY IF EXISTS "user_genres_delete" ON public.user_genres;
CREATE POLICY "user_genres_select" ON public.user_genres
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_genres_insert" ON public.user_genres
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_genres_delete" ON public.user_genres
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── books ─────────────────────────────────────────────────────
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "books_select" ON public.books;
CREATE POLICY "books_select" ON public.books
  FOR SELECT TO authenticated USING (true);

-- ── user_books ────────────────────────────────────────────────
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_books_select" ON public.user_books;
DROP POLICY IF EXISTS "user_books_insert" ON public.user_books;
DROP POLICY IF EXISTS "user_books_update" ON public.user_books;
DROP POLICY IF EXISTS "user_books_delete" ON public.user_books;
CREATE POLICY "user_books_select" ON public.user_books
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_public = true);
CREATE POLICY "user_books_insert" ON public.user_books
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "user_books_update" ON public.user_books
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "user_books_delete" ON public.user_books
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── reading_goals ─────────────────────────────────────────────
ALTER TABLE public.reading_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reading_goals_owner" ON public.reading_goals;
CREATE POLICY "reading_goals_owner" ON public.reading_goals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── posts ─────────────────────────────────────────────────────
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_select" ON public.posts
  FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "posts_insert" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts_update" ON public.posts
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "posts_delete" ON public.posts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── comments ──────────────────────────────────────────────────
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "comments_insert" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_delete" ON public.comments
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ── notifications ─────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ── friendship ────────────────────────────────────────────────
ALTER TABLE public.friendship ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "friendship_select" ON public.friendship;
DROP POLICY IF EXISTS "friendship_insert" ON public.friendship;
DROP POLICY IF EXISTS "friendship_update" ON public.friendship;
CREATE POLICY "friendship_select" ON public.friendship
  FOR SELECT TO authenticated
  USING (user_id1 = auth.uid() OR user_id2 = auth.uid());
CREATE POLICY "friendship_insert" ON public.friendship
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY "friendship_update" ON public.friendship
  FOR UPDATE TO authenticated
  USING (user_id1 = auth.uid() OR user_id2 = auth.uid());
