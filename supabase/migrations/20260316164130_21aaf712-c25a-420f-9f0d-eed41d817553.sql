CREATE POLICY "Athletes can insert exercises in their program sessions"
ON public.session_exercises FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM sessions s
    JOIN program_weeks pw ON pw.id = s.week_id
    JOIN programs p ON p.id = pw.program_id
    WHERE s.id = session_exercises.session_id
      AND p.student_id = auth.uid()
  )
);