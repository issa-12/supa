-- =============================================================
-- ReadTrack — Day 7: Comments & Likes
-- =============================================================

-- Fix comments_select to handle NULL is_deleted (same pattern as posts fix)
ALTER TABLE public.comments ALTER COLUMN is_deleted SET DEFAULT false;
UPDATE public.comments SET is_deleted = false WHERE is_deleted IS NULL;

DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT TO authenticated USING (is_deleted IS NOT TRUE);

-- RLS for post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "post_likes_select" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_insert" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_delete" ON public.post_likes;
CREATE POLICY "post_likes_select" ON public.post_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_likes_insert" ON public.post_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_likes_delete" ON public.post_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- RLS for comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comment_likes_select" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_insert" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_delete" ON public.comment_likes;
CREATE POLICY "comment_likes_select" ON public.comment_likes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "comment_likes_insert" ON public.comment_likes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "comment_likes_delete" ON public.comment_likes
  FOR DELETE TO authenticated USING (user_id = auth.uid());
