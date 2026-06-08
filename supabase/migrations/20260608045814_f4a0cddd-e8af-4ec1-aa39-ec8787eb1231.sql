CREATE POLICY "athlete_can_manage_own_program_session_exercises"
  ON public.session_exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM sessions s
      JOIN program_weeks pw ON pw.id = s.week_id
      JOIN programs p ON p.id = pw.program_id
      WHERE s.id = session_exercises.session_id
        AND p.student_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM completed_sessions cs
      WHERE cs.session_id = session_exercises.session_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM sessions s
      JOIN program_weeks pw ON pw.id = s.week_id
      JOIN programs p ON p.id = pw.program_id
      WHERE s.id = session_exercises.session_id
        AND p.student_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM completed_sessions cs
      WHERE cs.session_id = session_exercises.session_id
    )
  );