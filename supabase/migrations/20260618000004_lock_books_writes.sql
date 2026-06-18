-- =============================================================
-- CRITICAL: remove all browser write access to the shared books catalog.
--
-- The books_insert/books_update policies used WITH CHECK (true) / USING (true),
-- so ANY authenticated user could PATCH/POST public.books directly via the REST
-- API and rewrite every book's title/author/description (demonstrated: an
-- attacker set the whole catalog's title to "test" / "HACKED").
--
-- Catalog writes now happen ONLY through the backend service-role client
-- (POST /api/books/ensure), which bypasses RLS. Reading stays public (book
-- metadata is not sensitive). DELETE was never granted to clients.
-- =============================================================

DROP POLICY IF EXISTS "books_insert" ON public.books;
DROP POLICY IF EXISTS "books_update" ON public.books;

-- No replacement INSERT/UPDATE policies are created → with RLS enabled and no
-- permissive policy, authenticated clients are default-denied for writes.
-- (books_select remains so the catalog is still readable.)
