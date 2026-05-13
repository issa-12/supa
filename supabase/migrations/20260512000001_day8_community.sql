-- =============================================================
-- ReadTrack — Day 8: Community Completion
-- =============================================================

-- Allow authenticated users to create notifications for others.
-- actor_user_id must equal the logged-in user so nobody can fake
-- notifications on someone else's behalf. Self-notifications blocked.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid() AND user_id <> auth.uid());
