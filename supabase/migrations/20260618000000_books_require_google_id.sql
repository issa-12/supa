-- =============================================================
-- Harden the books catalog: every catalog row must come from Google
-- Books (a non-null, non-empty google_books_id). The original
-- books_insert / books_update policies used WITH CHECK (true), which let
-- any authenticated user insert an arbitrary "internal" book with
-- google_books_id = NULL (no relation to a real Google Books volume).
--
-- This only affects NEW writes (WITH CHECK), so existing rows are
-- untouched. Every legitimate app path (add-to-shelf, community post
-- book picker, AI recommendation enrichment) already sets google_books_id.
-- =============================================================

DROP POLICY IF EXISTS "books_insert" ON public.books;
CREATE POLICY "books_insert" ON public.books
  FOR INSERT TO authenticated
  WITH CHECK (
    google_books_id IS NOT NULL
    AND length(btrim(google_books_id)) > 0
    AND title IS NOT NULL
    AND length(btrim(title)) > 0
  );

DROP POLICY IF EXISTS "books_update" ON public.books;
CREATE POLICY "books_update" ON public.books
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (
    google_books_id IS NOT NULL
    AND length(btrim(google_books_id)) > 0
  );
