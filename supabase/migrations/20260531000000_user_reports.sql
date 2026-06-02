-- =============================================================
-- Reports table: users can flag other users for moderator review.
-- =============================================================

-- Drop any prior incompatible version (this table is new in this PR,
-- so it's safe to recreate — no data worth preserving yet).
DROP TABLE IF EXISTS public.user_reports CASCADE;

CREATE TABLE public.user_reports (
  id              SERIAL PRIMARY KEY,
  reporter_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason          TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_reports_self_report_check CHECK (reporter_id <> reported_id),
  CONSTRAINT user_reports_reason_check CHECK (
    reason IN ('spam', 'harassment', 'inappropriate_content', 'impersonation', 'other')
  ),
  CONSTRAINT user_reports_status_check CHECK (
    status IN ('pending', 'reviewed', 'dismissed', 'actioned')
  )
);

CREATE INDEX IF NOT EXISTS user_reports_reporter_idx ON public.user_reports(reporter_id);
CREATE INDEX IF NOT EXISTS user_reports_reported_idx ON public.user_reports(reported_id);
CREATE INDEX IF NOT EXISTS user_reports_status_idx ON public.user_reports(status);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_reports_select_own ON public.user_reports;
CREATE POLICY user_reports_select_own ON public.user_reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS user_reports_insert_self ON public.user_reports;
CREATE POLICY user_reports_insert_self ON public.user_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND reported_id <> auth.uid());
