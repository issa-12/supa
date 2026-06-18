-- =============================================================
-- Mark which public.users rows belong to a fully-onboarded account.
--
-- Why: the signup flow inserts the public.users row at REQUEST time
-- (before the email OTP is verified), so abandoned / never-verified
-- signups were still appearing in user search. We add a `verified`
-- flag, default false, set true only once the email is verified (or
-- for OAuth accounts, which are inherently verified). User search then
-- filters to verified = true.
-- =============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Backfill existing rows so current real users don't vanish from search.
-- An account counts as verified if the app marked the email verified, OR
-- it was created through a non-email (OAuth) provider.
UPDATE public.users u
SET verified = true
FROM auth.users a
WHERE u.id = a.id
  AND (
    (a.raw_user_meta_data ->> 'app_email_verified')::boolean IS TRUE
    OR COALESCE(a.raw_app_meta_data ->> 'provider', 'email') <> 'email'
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(
        COALESCE(a.raw_app_meta_data -> 'providers', '[]'::jsonb)
      ) AS p
      WHERE p <> 'email'
    )
  );
