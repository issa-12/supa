-- =============================================================
-- RLS hardening: add WITH CHECK to every UPDATE policy so owners
-- cannot mutate the owner column to gift rows onto other users.
-- =============================================================

-- ── users ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── user_books ────────────────────────────────────────────────
DROP POLICY IF EXISTS "user_books_update" ON public.user_books;
CREATE POLICY "user_books_update" ON public.user_books
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── posts ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update" ON public.posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── notifications ─────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── friendship ────────────────────────────────────────────────
DROP POLICY IF EXISTS "friendship_update" ON public.friendship;
CREATE POLICY "friendship_update" ON public.friendship
  FOR UPDATE TO authenticated
  USING (user_id1 = auth.uid() OR user_id2 = auth.uid())
  WITH CHECK (user_id1 = auth.uid() OR user_id2 = auth.uid());
