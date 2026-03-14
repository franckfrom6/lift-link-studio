
CREATE OR REPLACE FUNCTION public.session_is_completed(_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.completed_sessions WHERE session_id = _session_id
  )
$$;

DROP POLICY IF EXISTS "athlete_can_soft_delete_sessions" ON sessions;

CREATE POLICY "athlete_can_soft_delete_sessions" ON sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM program_weeks pw
      JOIN programs p ON p.id = pw.program_id
      WHERE pw.id = sessions.week_id
        AND p.student_id = auth.uid()
    )
    AND NOT public.session_is_completed(sessions.id)
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_weeks pw
      JOIN programs p ON p.id = pw.program_id
      WHERE pw.id = sessions.week_id
        AND p.student_id = auth.uid()
    )
  );
