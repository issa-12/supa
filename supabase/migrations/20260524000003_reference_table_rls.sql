-- =============================================================
-- Enable RLS on reference tables to keep parity with the rest of
-- the schema. Reference data stays readable to all authenticated
-- users; nobody can mutate it from the client.
-- =============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'reading_statuses',
    'friendship_status',
    'notifications_type',
    'language',
    'moderation_actions'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "%I_select" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%I_select" ON public.%I FOR SELECT TO authenticated USING (true)',
      t, t
    );
  END LOOP;
END;
$$;
