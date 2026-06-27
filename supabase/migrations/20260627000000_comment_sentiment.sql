-- Add sentiment column to comments (mirrors posts.sentiment).
-- Populated server-side by the same moderateAndAnalyze call that runs moderation.
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS sentiment TEXT;
