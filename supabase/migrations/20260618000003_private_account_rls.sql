-- =============================================================
-- Enforce private accounts at the DATABASE layer (was UI-gated only).
--
-- A private user's content (shelf/reviews, posts, comments) must be
-- invisible to anyone who isn't the owner or an accepted friend — even
-- via a direct API query. We add a helper that decides visibility and
-- fold it into the SELECT policies of user_books / posts / comments.
--
-- The backend uses the service-role client (bypasses RLS), so the
-- community feed, stats, and rating aggregation are unaffected; this only
-- tightens what the browser (anon + JWT) can read directly.
-- =============================================================

-- SECURITY DEFINER so it can read users/friendship regardless of the
-- caller's RLS; STABLE so the planner can cache it within a statement.
CREATE OR REPLACE FUNCTION public.is_visible_author(author uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    author = auth.uid()
    OR NOT COALESCE((SELECT is_private FROM public.users WHERE id = author), false)
    OR EXISTS (
      SELECT 1
      FROM public.friendship f
      JOIN public.friendship_status s ON s.status_id = f.status_id
      WHERE s.status_name = 'accepted'
        AND (
          (f.user_id1 = auth.uid() AND f.user_id2 = author)
          OR (f.user_id2 = auth.uid() AND f.user_id1 = author)
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_visible_author(uuid) TO authenticated;

-- ── user_books: owner always; otherwise public AND author visible ──
DROP POLICY IF EXISTS "user_books_select" ON public.user_books;
CREATE POLICY "user_books_select" ON public.user_books
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (is_public = true AND public.is_visible_author(user_id))
  );

-- ── posts: non-deleted AND author visible (owner always passes) ──
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts
  FOR SELECT TO authenticated
  USING (is_deleted IS NOT TRUE AND public.is_visible_author(user_id));

-- ── comments: non-deleted AND author visible ──
DROP POLICY IF EXISTS "comments_select" ON public.comments;
CREATE POLICY "comments_select" ON public.comments
  FOR SELECT TO authenticated
  USING (is_deleted IS NOT TRUE AND public.is_visible_author(user_id));
