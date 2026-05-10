-- =============================================================
-- Day 2: ON DELETE CASCADE for auth user deletion +
--        Books catalog policies + user_books uniqueness
-- =============================================================

-- ── 1. public.users → auth.users  (ON DELETE CASCADE) ────────
DO $$
DECLARE v_fk text;
BEGIN
  SELECT conname INTO v_fk
  FROM pg_constraint
  WHERE conrelid  = 'public.users'::regclass
    AND confrelid = 'auth.users'::regclass
    AND contype   = 'f'
  LIMIT 1;

  IF v_fk IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', v_fk);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname    = 'users_id_fkey_cascade'
      AND conrelid   = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_fkey_cascade
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- ── 2. public.profiles → auth.users  (ON DELETE CASCADE) ─────
DO $$
DECLARE v_fk text;
BEGIN
  SELECT conname INTO v_fk
  FROM pg_constraint
  WHERE conrelid  = 'public.profiles'::regclass
    AND confrelid = 'auth.users'::regclass
    AND contype   = 'f'
  LIMIT 1;

  IF v_fk IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', v_fk);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname  = 'profiles_user_id_fkey_cascade'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_fkey_cascade
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- ── 3. Books catalog — allow authenticated users to insert/update ──
DROP POLICY IF EXISTS "books_insert" ON public.books;
CREATE POLICY "books_insert" ON public.books
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "books_update" ON public.books;
CREATE POLICY "books_update" ON public.books
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── 4. user_books — prevent duplicate shelf entries ───────────
CREATE UNIQUE INDEX IF NOT EXISTS user_books_user_book_unique
  ON public.user_books(user_id, book_id);
