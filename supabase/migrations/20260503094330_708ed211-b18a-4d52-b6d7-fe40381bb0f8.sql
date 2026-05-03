ALTER TABLE public.external_sessions
  ADD COLUMN IF NOT EXISTS avg_pace_s_per_km numeric,
  ADD COLUMN IF NOT EXISTS metrics jsonb,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS external_id text;

CREATE UNIQUE INDEX IF NOT EXISTS external_sessions_source_external_id_unique
  ON public.external_sessions (source, external_id)
  WHERE external_id IS NOT NULL;
