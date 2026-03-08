
-- Session feedback table
CREATE TABLE public.session_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completed_session_id uuid NOT NULL REFERENCES public.completed_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  overall_rating smallint NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  energy_post smallint CHECK (energy_post BETWEEN 1 AND 5),
  muscle_pump smallint CHECK (muscle_pump BETWEEN 1 AND 5),
  joint_discomfort boolean NOT NULL DEFAULT false,
  joint_discomfort_location text[],
  joint_discomfort_details text,
  exercises_too_easy text[],
  exercises_too_hard text[],
  exercises_pain text[],
  mood_after text CHECK (mood_after IN ('energized','neutral','exhausted','frustrated','satisfied')),
  free_comment text,
  would_repeat boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(completed_session_id)
);

ALTER TABLE public.session_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their feedback"
  ON public.session_feedback FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can view student feedback"
  ON public.session_feedback FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM completed_sessions cs
    JOIN coach_students rel ON rel.student_id = cs.student_id AND rel.coach_id = auth.uid() AND rel.status = 'active'
    WHERE cs.id = session_feedback.completed_session_id
  ));

-- Adaptation logs table
CREATE TABLE public.adaptation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  student_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  ai_response jsonb NOT NULL,
  adaptations_applied jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.adaptation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their adaptation logs"
  ON public.adaptation_logs FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Enable realtime for feedback
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_feedback;
