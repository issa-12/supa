-- =============================================================
-- ReadTrack — Stats aggregation RPC functions
-- Pushes the top-books / top-readers / trending-genres aggregation
-- into the database. Previously StatsService downloaded every matching
-- user_books / user_genres row and counted them in JS — a full-table
-- transfer that degrades as the platform grows. These functions
-- aggregate server-side and return only the small result set.
--
-- String columns are cast to text so the RETURNS TABLE signature does
-- not depend on the underlying varchar/char definitions.
-- =============================================================

-- ── Top books added/updated in a period ───────────────────────
CREATE OR REPLACE FUNCTION public.stats_top_books(since timestamptz)
RETURNS TABLE (
  book_id integer,
  title text,
  author_name text,
  cover_image_url text,
  google_books_id text,
  add_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    b.book_id,
    b.title::text,
    b.author_name::text,
    b.cover_image_url::text,
    b.google_books_id::text,
    COUNT(*) AS add_count
  FROM public.user_books ub
  JOIN public.books b ON b.book_id = ub.book_id
  WHERE ub.updated_at >= since
  GROUP BY b.book_id, b.title, b.author_name, b.cover_image_url, b.google_books_id
  ORDER BY add_count DESC
  LIMIT 5;
$$;

-- ── Trending genres (with total for percentage) ───────────────
-- SUM(...) OVER () is computed over all genres before LIMIT, so `total`
-- is the platform-wide selection count, not just the top 6.
CREATE OR REPLACE FUNCTION public.stats_trending_genres()
RETURNS TABLE (
  genre_name text,
  cnt bigint,
  total bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT genre_name, cnt, SUM(cnt) OVER () AS total
  FROM (
    SELECT g.genre_name::text AS genre_name, COUNT(*) AS cnt
    FROM public.user_genres ug
    JOIN public.genres g ON g.genre_id = ug.genre_id
    GROUP BY g.genre_name
  ) sub
  ORDER BY cnt DESC
  LIMIT 6;
$$;

-- ── Top readers (books with the "read" status) ────────────────
-- Replaces the two-query pattern (count in JS, then .in() on users):
-- joins user_books → users and aggregates in one pass.
CREATE OR REPLACE FUNCTION public.stats_top_readers(read_status_id integer)
RETURNS TABLE (
  user_id uuid,
  name text,
  profile_picture_url text,
  books_read bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ub.user_id,
    u.name::text,
    u.profile_picture_url::text,
    COUNT(*) AS books_read
  FROM public.user_books ub
  JOIN public.users u ON u.id = ub.user_id
  WHERE ub.status_id = read_status_id
  GROUP BY ub.user_id, u.name, u.profile_picture_url
  ORDER BY books_read DESC
  LIMIT 5;
$$;
