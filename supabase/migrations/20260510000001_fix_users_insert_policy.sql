-- Fix: public.users was missing an INSERT policy.
-- ensurePublicUser() (called on every login) does an upsert which
-- needs INSERT permission even when the row already exists.
DROP POLICY IF EXISTS "users_insert" ON public.users;

CREATE POLICY "users_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
