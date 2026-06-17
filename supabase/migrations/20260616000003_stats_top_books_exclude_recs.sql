-- =============================================================
-- ReadTrack — Exclude pending friend recommendations from Top Books
-- Friend recommendations auto-insert a user_books row in the recipient's
-- shelf (status `recommended_by_friend`) that they did not choose. Those
-- should not inflate the "Top Books" trending stat until accepted (which
-- moves them to want_to_read). Re-defines stats_top_books to skip that
-- status. (stats_trending_genres / stats_top_readers are unaffected:
-- genres are independent and top readers count only the `read` status.)
-- =============================================================

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
  JOIN public.reading_statuses rs ON rs.status_id = ub.status_id
  WHERE ub.updated_at >= since
    AND rs.status_name <> 'recommended_by_friend'
  GROUP BY b.book_id, b.title, b.author_name, b.cover_image_url, b.google_books_id
  ORDER BY add_count DESC
  LIMIT 5;
$$;
