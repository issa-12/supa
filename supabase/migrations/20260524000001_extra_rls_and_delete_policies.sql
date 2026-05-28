-- =============================================================
-- Fill in missing INSERT / UPDATE / DELETE policies so client-side
-- access works without the service-role key, and so users can
-- clear their own notifications.
-- =============================================================

-- ── ai_recommendations: full owner-only policy set ────────────
DROP POLICY IF EXISTS "ai_recommendations_insert" ON public.ai_recommendations;
CREATE POLICY "ai_recommendations_insert" ON public.ai_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_recommendations_update" ON public.ai_recommendations;
CREATE POLICY "ai_recommendations_update" ON public.ai_recommendations
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "ai_recommendations_delete" ON public.ai_recommendations;
CREATE POLICY "ai_recommendations_delete" ON public.ai_recommendations
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── notifications: let users clear their own notifications ────
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── friendship: let either party delete an accepted/pending row
-- (the friends backend uses service-role today, but adding a real
--  policy keeps the table aligned with the rest of the schema.)
DROP POLICY IF EXISTS "friendship_delete" ON public.friendship;
CREATE POLICY "friendship_delete" ON public.friendship
  FOR DELETE TO authenticated
  USING (user_id1 = auth.uid() OR user_id2 = auth.uid());

-- ── user_books: also allow checking on insert (owner-only) ────
-- (already present in day-1 migration but re-asserted for clarity)
DROP POLICY IF EXISTS "user_books_insert" ON public.user_books;
CREATE POLICY "user_books_insert" ON public.user_books
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
