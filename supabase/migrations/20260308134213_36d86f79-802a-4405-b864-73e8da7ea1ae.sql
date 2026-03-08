
-- Session swaps table
CREATE TABLE public.session_swaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  original_day smallint NOT NULL,
  new_day smallint NOT NULL,
  original_date date NOT NULL,
  new_date date NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_swaps ENABLE ROW LEVEL SECURITY;

-- Students can manage their own swaps
CREATE POLICY "Students can manage their swaps"
  ON public.session_swaps FOR ALL
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Coaches can view their students' swaps
CREATE POLICY "Coaches can view student swaps"
  ON public.session_swaps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.coach_students cs
      WHERE cs.coach_id = auth.uid()
        AND cs.student_id = session_swaps.student_id
        AND cs.status = 'active'
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_swaps;
