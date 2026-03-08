
-- External sessions table
CREATE TABLE public.external_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL,
  time_start time NULL,
  time_end time NULL,
  activity_type text NOT NULL DEFAULT 'other',
  activity_label text NULL,
  provider text NULL,
  location text NULL,
  intensity_perceived smallint NULL,
  duration_minutes integer NULL,
  notes text NULL,
  muscle_groups_involved text[] NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.external_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their external sessions"
  ON public.external_sessions FOR ALL
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view student external sessions"
  ON public.external_sessions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_students cs
    WHERE cs.coach_id = auth.uid()
      AND cs.student_id = external_sessions.student_id
      AND cs.status = 'active'
  ));

-- Weekly check-ins table
CREATE TABLE public.weekly_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  week_start date NOT NULL,
  energy_level smallint NOT NULL,
  sleep_quality smallint NOT NULL,
  stress_level smallint NOT NULL,
  muscle_soreness smallint NOT NULL,
  soreness_location text[] NULL,
  availability_notes text NULL,
  general_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, week_start)
);

ALTER TABLE public.weekly_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their checkins"
  ON public.weekly_checkins FOR ALL
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view student checkins"
  ON public.weekly_checkins FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_students cs
    WHERE cs.coach_id = auth.uid()
      AND cs.student_id = weekly_checkins.student_id
      AND cs.status = 'active'
  ));

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.external_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_checkins;
