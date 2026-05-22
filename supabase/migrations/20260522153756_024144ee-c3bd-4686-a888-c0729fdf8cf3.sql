ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS session_type text NOT NULL DEFAULT 'strength'
    CHECK (session_type IN ('strength', 'running')),
  ADD COLUMN IF NOT EXISTS run_blocks jsonb;

CREATE TABLE IF NOT EXISTS public.race_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_type text NOT NULL CHECK (race_type IN (
    '5k', '10k', 'half_marathon', 'marathon', 'trail_20k', 'trail_50k'
  )),
  target_date date NOT NULL,
  target_time_min integer,
  current_weekly_km integer,
  current_easy_pace_s_per_km integer,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.race_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage their own race goals"
  ON public.race_goals FOR ALL USING (auth.uid() = student_id);