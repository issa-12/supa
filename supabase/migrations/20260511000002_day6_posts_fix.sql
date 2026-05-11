-- Fix existing posts where is_deleted was never set (inserted as NULL)
UPDATE public.posts SET is_deleted = false WHERE is_deleted IS NULL;

-- Ensure future inserts without is_deleted default to false
ALTER TABLE public.posts ALTER COLUMN is_deleted SET DEFAULT false;

-- Harden the select policy: IS NOT TRUE matches both false AND null,
-- so posts inserted before the DEFAULT was set remain visible.
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts
  FOR SELECT TO authenticated USING (is_deleted IS NOT TRUE);
