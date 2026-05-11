-- =============================================================
-- ReadTrack — Day 5: Notifications
-- =============================================================

-- Enable Realtime on the notifications table so the Angular
-- client can subscribe to INSERT events for the current user.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
