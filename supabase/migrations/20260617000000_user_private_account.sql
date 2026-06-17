-- =============================================================
-- ReadTrack — Private accounts
-- A user can mark their profile private. When private, their detailed
-- profile (shelf/stats/posts) and their community posts/comments are
-- visible only to accepted friends. Enforced at the app layer (community
-- feed filtering uses the backend admin client; the profile page gates the
-- view). Search still finds private users — their profile just shows a
-- locked state to non-friends.
-- =============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false;
