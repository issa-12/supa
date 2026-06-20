-- Maintain an honest completion timestamp for analytics.
-- Existing completed rows are backfilled from updated_at/added_at. Future
-- transitions into "read" receive the current timestamp automatically.

UPDATE public.user_books ub
SET read_at = COALESCE(ub.read_at, ub.updated_at, ub.added_at, now())
FROM public.reading_statuses rs
WHERE rs.status_id = ub.status_id
  AND rs.status_name = 'read'
  AND ub.read_at IS NULL;

CREATE OR REPLACE FUNCTION public.maintain_user_book_read_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_status_name text;
  old_status_name text;
BEGIN
  SELECT status_name INTO new_status_name
  FROM public.reading_statuses
  WHERE status_id = NEW.status_id;

  IF TG_OP = 'UPDATE' THEN
    SELECT status_name INTO old_status_name
    FROM public.reading_statuses
    WHERE status_id = OLD.status_id;
  END IF;

  IF new_status_name = 'read' AND (TG_OP = 'INSERT' OR old_status_name IS DISTINCT FROM 'read') THEN
    NEW.read_at := COALESCE(NEW.read_at, now());
  ELSIF new_status_name <> 'read' AND TG_OP = 'UPDATE' AND old_status_name = 'read' THEN
    NEW.read_at := NULL;
  END IF;

  NEW.updated_at := COALESCE(NEW.updated_at, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_books_maintain_read_at ON public.user_books;
CREATE TRIGGER user_books_maintain_read_at
BEFORE INSERT OR UPDATE OF status_id ON public.user_books
FOR EACH ROW EXECUTE FUNCTION public.maintain_user_book_read_at();

CREATE INDEX IF NOT EXISTS idx_user_books_read_at
  ON public.user_books(read_at DESC)
  WHERE read_at IS NOT NULL;

-- Realtime invalidation sources for the analytics dashboard. The browser
-- receives only changes allowed by each table's SELECT/RLS policies, then
-- refetches the server-computed aggregate dashboard.
DO $$
DECLARE
  analytics_table text;
BEGIN
  FOREACH analytics_table IN ARRAY ARRAY[
    'user_books',
    'user_genres',
    'posts',
    'comments',
    'post_likes',
    'comment_likes',
    'review_likes',
    'friendship',
    'users'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = analytics_table
    ) THEN
      EXECUTE format(
        'ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',
        analytics_table
      );
    END IF;
  END LOOP;
END;
$$;
