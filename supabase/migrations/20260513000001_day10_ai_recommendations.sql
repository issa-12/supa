-- Day 10: AI Recommendations cache table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recommendations JSONB       NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '24 hours'
);

-- One cached row per user; upsert conflicts on this
CREATE UNIQUE INDEX IF NOT EXISTS ai_recommendations_user_id_idx
  ON public.ai_recommendations(user_id);

ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own ai recommendations"
  ON public.ai_recommendations FOR SELECT
  USING (auth.uid() = user_id);
