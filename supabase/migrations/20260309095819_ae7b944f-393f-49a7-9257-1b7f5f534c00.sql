
-- Feature 1: Skipped exercises table
CREATE TABLE public.skipped_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completed_session_id uuid NOT NULL REFERENCES public.completed_sessions(id) ON DELETE CASCADE,
  session_exercise_id uuid NOT NULL REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  reason text,
  reason_detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.skipped_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their skipped exercises"
  ON public.skipped_exercises FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM completed_sessions cs WHERE cs.id = skipped_exercises.completed_session_id AND cs.student_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM completed_sessions cs WHERE cs.id = skipped_exercises.completed_session_id AND cs.student_id = auth.uid()
  ));

CREATE POLICY "Coaches can view student skipped exercises"
  ON public.skipped_exercises FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM completed_sessions cs
    JOIN coach_students rel ON rel.student_id = cs.student_id AND rel.coach_id = auth.uid() AND rel.status = 'active'
    WHERE cs.id = skipped_exercises.completed_session_id
  ));

-- Feature 2: Free session columns on sessions table
ALTER TABLE public.sessions ADD COLUMN is_free_session boolean NOT NULL DEFAULT false;
ALTER TABLE public.sessions ADD COLUMN created_by uuid;
ALTER TABLE public.sessions ADD COLUMN free_session_date date;

-- RLS for free sessions: athletes can manage their own free sessions
CREATE POLICY "Athletes can manage their free sessions"
  ON public.sessions FOR ALL TO authenticated
  USING (is_free_session = true AND created_by = auth.uid())
  WITH CHECK (is_free_session = true AND created_by = auth.uid());

-- Coaches can view free sessions of their athletes
CREATE POLICY "Coaches can view athlete free sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (is_free_session = true AND EXISTS (
    SELECT 1 FROM coach_students cs WHERE cs.coach_id = auth.uid() AND cs.student_id = sessions.created_by AND cs.status = 'active'
  ));

-- RLS for session_exercises on free sessions
CREATE POLICY "Athletes can manage exercises in free sessions"
  ON public.session_exercises FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s WHERE s.id = session_exercises.session_id AND s.is_free_session = true AND s.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s WHERE s.id = session_exercises.session_id AND s.is_free_session = true AND s.created_by = auth.uid()
  ));

-- Completed sessions for free sessions
CREATE POLICY "Athletes can manage completed free sessions"
  ON public.completed_sessions FOR ALL TO authenticated
  USING (
    auth.uid() = student_id AND EXISTS (
      SELECT 1 FROM sessions s WHERE s.id = completed_sessions.session_id AND s.is_free_session = true AND s.created_by = auth.uid()
    )
  );

-- Make week_id nullable for free sessions
ALTER TABLE public.sessions ALTER COLUMN week_id DROP NOT NULL;
