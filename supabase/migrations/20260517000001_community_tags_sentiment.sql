-- ── Community: tags, sentiment, moderation ──────────────────────────────────

ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS tags               TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sentiment          TEXT,           -- positive | negative | neutral | mixed
  ADD COLUMN IF NOT EXISTS moderation_status  TEXT    DEFAULT 'approved';  -- approved | flagged | rejected

-- GIN index for fast tag array search
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);

-- Refresh SELECT policy: hide deleted AND rejected posts
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts
  FOR SELECT TO authenticated
  USING (
    is_deleted IS NOT TRUE
    AND (moderation_status IS NULL OR moderation_status <> 'rejected')
  );
