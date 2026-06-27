-- Auto-generate a username for every account so the @handle is never empty.
--
-- Done in the DB (not app code) so it covers BOTH signup paths in one place:
-- the email/OTP flow (backend upserts public.users) and Google OAuth (the SPA
-- upserts public.users). Users can change it later on their profile; the editor
-- shares the same rule (3–30 chars, lowercase letters / digits / underscore).
--
-- Shape: <email-local-part, sanitized & ≤20 chars, fallback "reader">_<suffix>.

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
  -- Respect an explicitly provided username (e.g. a future signup field).
  IF NEW.username IS NOT NULL AND NEW.username <> '' THEN
    RETURN NEW;
  END IF;

  base := COALESCE(
    NULLIF(
      LEFT(REGEXP_REPLACE(LOWER(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'), 20),
      ''
    ),
    'reader'
  );

  -- Random 4-char suffix, retried on the (rare) collision; after a few tries
  -- widen to an 8-char suffix that also mixes in the row id for near-certainty.
  LOOP
    candidate := base || '_' || SUBSTR(MD5(random()::text || clock_timestamp()::text), 1, 4);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE username = candidate);
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

DROP TRIGGER IF EXISTS users_set_default_username ON public.users;
CREATE TRIGGER users_set_default_username
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_username();

-- Backfill existing accounts that have no username. Looped (not one UPDATE) so
-- each candidate is checked against the live table — including handles already
-- set AND ones assigned earlier in this same loop — using a random suffix with
-- retry. A plain id-derived suffix is NOT safe here: seed/test rows can share a
-- UUID prefix (e.g. aaaaaaaa-…), which would collide on the UNIQUE constraint.
DO $backfill$
DECLARE
  r RECORD;
  base text;
  candidate text;
  tries int;
BEGIN
  FOR r IN
    SELECT id, email FROM public.users WHERE username IS NULL OR username = ''
  LOOP
    base := COALESCE(
      NULLIF(
        LEFT(REGEXP_REPLACE(LOWER(SPLIT_PART(COALESCE(r.email, ''), '@', 1)), '[^a-z0-9_]', '', 'g'), 20),
        ''
      ),
      'reader'
    );
    tries := 0;
    LOOP
      candidate := base || '_' || SUBSTR(MD5(random()::text || clock_timestamp()::text || r.id::text), 1, 6);
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE username = candidate);
      tries := tries + 1;
      IF tries >= 20 THEN
        -- Keep the fallback within the editor's 30-char rule: base(≤20)+_+8 ≤ 29.
        candidate := base || '_' || SUBSTR(MD5(random()::text || r.id::text), 1, 8);
        EXIT;
      END IF;
    END LOOP;
    UPDATE public.users SET username = candidate WHERE id = r.id;
  END LOOP;
END $backfill$;
