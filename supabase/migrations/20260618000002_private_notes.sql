-- =============================================================
-- Make private reading notes TRULY private.
--
-- Notes used to live in user_books.note, but user_books rows are world-
-- readable when is_public = true (RLS: user_id = auth.uid() OR is_public),
-- so a determined user could read another user's "private" notes via a
-- direct API query. Move notes into their own table whose RLS restricts
-- every operation to the owner — no public-read path at all.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.user_book_notes (
  user_book_id INTEGER PRIMARY KEY REFERENCES public.user_books(user_book_id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  note         TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_book_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_book_notes_all" ON public.user_book_notes;
CREATE POLICY "user_book_notes_all" ON public.user_book_notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Migrate any existing notes, then drop the exposed column.
INSERT INTO public.user_book_notes (user_book_id, user_id, note)
SELECT user_book_id, user_id, note
FROM public.user_books
WHERE note IS NOT NULL AND btrim(note) <> ''
ON CONFLICT (user_book_id) DO NOTHING;

ALTER TABLE public.user_books DROP COLUMN IF EXISTS note;
