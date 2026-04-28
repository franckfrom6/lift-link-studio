-- 1. Strava connections table
CREATE TABLE IF NOT EXISTS public.strava_connections (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  strava_athlete_id     bigint NOT NULL,
  access_token          text NOT NULL,
  refresh_token         text NOT NULL,
  token_expires_at      timestamptz NOT NULL,
  scope                 text,
  strava_profile        jsonb,
  last_sync_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_strava_connections_user_id ON public.strava_connections(user_id);

-- 2. RLS
ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strava connection"
  ON public.strava_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own strava connection"
  ON public.strava_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own strava connection"
  ON public.strava_connections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own strava connection"
  ON public.strava_connections FOR DELETE
  USING (user_id = auth.uid());

-- 3. Extend external_sessions
ALTER TABLE public.external_sessions ADD COLUMN IF NOT EXISTS strava_activity_id bigint;
ALTER TABLE public.external_sessions ADD COLUMN IF NOT EXISTS strava_raw jsonb;
ALTER TABLE public.external_sessions ADD COLUMN IF NOT EXISTS distance_meters int;
ALTER TABLE public.external_sessions ADD COLUMN IF NOT EXISTS elevation_gain_m int;
ALTER TABLE public.external_sessions ADD COLUMN IF NOT EXISTS avg_heart_rate smallint;
ALTER TABLE public.external_sessions ADD COLUMN IF NOT EXISTS max_heart_rate smallint;
ALTER TABLE public.external_sessions ADD COLUMN IF NOT EXISTS calories int;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'external_sessions_strava_activity_id_key'
  ) THEN
    ALTER TABLE public.external_sessions
      ADD CONSTRAINT external_sessions_strava_activity_id_key UNIQUE (strava_activity_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_external_sessions_strava_activity_id
  ON public.external_sessions(strava_activity_id);

-- 4. updated_at trigger (project uses public.update_updated_at_column())
DROP TRIGGER IF EXISTS set_strava_connections_updated_at ON public.strava_connections;
CREATE TRIGGER set_strava_connections_updated_at
  BEFORE UPDATE ON public.strava_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();