-- =============================================================
-- ReadTrack — Day 9: Profile Enhancements
-- =============================================================

-- Unique constraint so we can upsert reading goals (one row per user per year)
ALTER TABLE public.reading_goals
  DROP CONSTRAINT IF EXISTS reading_goals_user_year_unique;

ALTER TABLE public.reading_goals
  ADD CONSTRAINT reading_goals_user_year_unique UNIQUE (user_id, year);
