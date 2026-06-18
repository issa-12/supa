-- =============================================================
-- V-E: content was readable with only the public anon key (no login).
--
-- RLS policies are scoped TO authenticated, but the `anon` role still held the
-- table-level GRANTs, so unauthenticated PostgREST requests could read posts,
-- comments, post_likes, books, etc. The app never accesses tables as anon (the
-- browser uses the anon key + a user JWT = the `authenticated` role; the backend
-- uses the service role), so we revoke all anon table access in `public`.
-- =============================================================

REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- Belt-and-suspenders: also drop default privileges so future tables created by
-- the current owner don't silently re-grant anon.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon;
