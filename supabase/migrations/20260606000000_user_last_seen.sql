-- Add last_seen_at for heartbeat-based online presence tracking.
-- Updated by the client every 2 minutes; users seen within 5 min are "Online".
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
