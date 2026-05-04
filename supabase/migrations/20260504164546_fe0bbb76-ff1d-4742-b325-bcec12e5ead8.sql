
-- Athlete favorites
CREATE TABLE public.exercise_favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, exercise_id)
);
CREATE INDEX idx_exercise_favorites_student ON public.exercise_favorites(student_id);

ALTER TABLE public.exercise_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage own favorites"
ON public.exercise_favorites FOR ALL
TO authenticated
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches view their athletes favorites"
ON public.exercise_favorites FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.coach_students cs
  WHERE cs.coach_id = auth.uid()
    AND cs.student_id = exercise_favorites.student_id
    AND cs.status = 'active'
));

-- Video requests
CREATE TABLE public.exercise_video_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exercise_video_requests_coach ON public.exercise_video_requests(coach_id, status);
CREATE INDEX idx_exercise_video_requests_student ON public.exercise_video_requests(student_id);

ALTER TABLE public.exercise_video_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes create their video requests"
ON public.exercise_video_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Athletes view own video requests"
ON public.exercise_video_requests FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Coaches view requests addressed to them"
ON public.exercise_video_requests FOR SELECT
TO authenticated
USING (auth.uid() = coach_id);

CREATE POLICY "Coaches update requests addressed to them"
ON public.exercise_video_requests FOR UPDATE
TO authenticated
USING (auth.uid() = coach_id)
WITH CHECK (auth.uid() = coach_id);

CREATE TRIGGER update_evr_updated_at
BEFORE UPDATE ON public.exercise_video_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
