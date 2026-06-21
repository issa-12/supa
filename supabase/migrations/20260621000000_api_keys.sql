-- Consumer API keys for the public API (/api/public/v1).
--
-- Keys are shown to the user in plaintext exactly once, at creation; only a
-- SHA-256 hash is stored here, so a database leak never exposes a usable key.
-- `key_prefix` is the first chars of the key (e.g. "rt_live_AbCd") kept for
-- display in the management UI and never secret on its own.

CREATE TABLE IF NOT EXISTS public.api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  key_prefix  text NOT NULL,
  key_hash    text NOT NULL UNIQUE,
  scopes      text[] NOT NULL DEFAULT ARRAY['read', 'write'],
  last_used_at timestamptz,
  revoked_at  timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Auth lookups hash the incoming key and match on key_hash (unique, already
-- indexed). This partial index speeds up the management list + prefix display.
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON public.api_keys(user_id) WHERE revoked_at IS NULL;

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Defense-in-depth: the backend creates/verifies keys with the service-role
-- client (bypasses RLS) and enforces ownership manually, but scope the
-- owner-readable view so a key row can never leak across users via the anon
-- client. Inserts/updates are backend-only (no client INSERT/UPDATE policy).
DROP POLICY IF EXISTS api_keys_select_own ON public.api_keys;
CREATE POLICY api_keys_select_own ON public.api_keys
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS api_keys_delete_own ON public.api_keys;
CREATE POLICY api_keys_delete_own ON public.api_keys
  FOR DELETE USING (user_id = auth.uid());
