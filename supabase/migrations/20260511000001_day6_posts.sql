-- =============================================================
-- ReadTrack — Day 6: Community Posts
-- =============================================================

-- Re-point posts.user_id FK to public.users so PostgREST can
-- join author data in a single query.
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_user_id_fkey;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- RLS (idempotent)
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;

CREATE POLICY "posts_select" ON public.posts
  FOR SELECT TO authenticated USING (is_deleted = false);

CREATE POLICY "posts_insert" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "posts_update" ON public.posts
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "posts_delete" ON public.posts
  FOR DELETE TO authenticated USING (user_id = auth.uid());
