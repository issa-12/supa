-- =============================================================
-- ReadTrack — Day 4: Friends System
-- =============================================================

-- Prevent duplicate friendship pairs (order-independent)
CREATE UNIQUE INDEX IF NOT EXISTS friendship_unique_pair
  ON public.friendship (
    LEAST(user_id1::text, user_id2::text),
    GREATEST(user_id1::text, user_id2::text)
  );

-- Re-point friendship FKs to public.users so PostgREST can join them
ALTER TABLE public.friendship
  DROP CONSTRAINT IF EXISTS friendship_user_id1_fkey,
  DROP CONSTRAINT IF EXISTS friendship_user_id2_fkey;

ALTER TABLE public.friendship
  ADD CONSTRAINT friendship_user_id1_fkey
    FOREIGN KEY (user_id1) REFERENCES public.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT friendship_user_id2_fkey
    FOREIGN KEY (user_id2) REFERENCES public.users(id) ON DELETE CASCADE;

-- Re-point requester_id FK to public.users as well
ALTER TABLE public.friendship
  DROP CONSTRAINT IF EXISTS friendship_requester_id_fkey;

ALTER TABLE public.friendship
  ADD CONSTRAINT friendship_requester_id_fkey
    FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;
