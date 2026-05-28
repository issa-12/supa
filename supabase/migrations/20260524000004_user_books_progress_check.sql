-- =============================================================
-- Defensive CHECK constraint: reading progress can't exceed total
-- pages. Prevents "page 500 of 200" from any client path.
-- =============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_books_progress_within_total'
      AND conrelid = 'public.user_books'::regclass
  ) THEN
    ALTER TABLE public.user_books
      ADD CONSTRAINT user_books_progress_within_total
      CHECK (
        current_page IS NULL
        OR current_page >= 0
        AND (total_pages IS NULL OR current_page <= total_pages)
      ) NOT VALID;
    -- NOT VALID: don't fail the migration on pre-existing bad rows;
    -- new writes are enforced from now on.
  END IF;
END;
$$;
