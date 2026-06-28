-- Make usernames case-insensitive: "Sally" and "sally" are the same handle.
--
-- The edit form already lowercases input, but the DB did not enforce it, so a
-- non-UI write (or the trigger's "respect a provided username" branch) could
-- still store mixed case — and uniqueness was case-SENSITIVE, so "Sally" and
-- "sally" could have coexisted. This makes the guarantee DB-level.

-- 1) Normalize any existing mixed-case usernames to lowercase. Safe: a prior
--    check confirmed there are no case-insensitive duplicates, so no collision
--    with the existing UNIQUE(username) constraint.
UPDATE public.users
SET username = lower(username)
WHERE username IS NOT NULL AND username <> lower(username);

-- 2) Enforce case-insensitive uniqueness — the hard guarantee, independent of
--    any client. With all values stored lowercase this also matches the plain
--    UNIQUE(username) constraint, which is kept as-is.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key
  ON public.users (lower(username));

-- 3) Update the generator so an explicitly-provided username is stored lowercase
--    and the uniqueness probe is case-insensitive.
CREATE OR REPLACE FUNCTION public.set_default_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
  candidate text;
  tries int := 0;
BEGIN
  -- A provided username is stored lowercase so handles are case-insensitive.
  IF NEW.username IS NOT NULL AND NEW.username <> '' THEN
    NEW.username := lower(NEW.username);
    RETURN NEW;
  END IF;

  base := COALESCE(
    NULLIF(
      LEFT(REGEXP_REPLACE(LOWER(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'), 20),
      ''
    ),
    'reader'
  );

  -- candidate is always lowercase (base + lowercase hex); probe case-insensitively.
  LOOP
    candidate := base || '_' || SUBSTR(MD5(random()::text || clock_timestamp()::text), 1, 4);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE lower(username) = candidate);
    tries := tries + 1;
    IF tries >= 10 THEN
      candidate := base || '_' || SUBSTR(MD5(random()::text || NEW.id::text), 1, 8);
      EXIT;
    END IF;
  END LOOP;

  NEW.username := candidate;
  RETURN NEW;
END;
$$;
