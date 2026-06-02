-- =============================================================
-- ReadTrack — Review reactions (like / dislike)
-- One reaction per user per review. A "review" is a user_books row
-- that has review_text; we key reactions off its user_book_id.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.review_likes (
  review_like_id BIGSERIAL PRIMARY KEY,
  user_book_id   INTEGER NOT NULL REFERENCES public.user_books(user_book_id) ON DELETE CASCADE,
  user_id        UUID    NOT NULL REFERENCES public.users(id)               ON DELETE CASCADE,
  is_like        BOOLEAN NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_book_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_likes_user_book ON public.review_likes(user_book_id);

ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "review_likes_select" ON public.review_likes;
CREATE POLICY "review_likes_select" ON public.review_likes
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "review_likes_insert" ON public.review_likes;
CREATE POLICY "review_likes_insert" ON public.review_likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "review_likes_update" ON public.review_likes;
CREATE POLICY "review_likes_update" ON public.review_likes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "review_likes_delete" ON public.review_likes;
CREATE POLICY "review_likes_delete" ON public.review_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
