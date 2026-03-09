
-- Allow athletes to manage sessions in their self-guided programs (coach_id IS NULL)
CREATE POLICY "Athletes can manage sessions in self-guided programs"
  ON public.sessions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM program_weeks pw
    JOIN programs p ON p.id = pw.program_id
    WHERE pw.id = sessions.week_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM program_weeks pw
    JOIN programs p ON p.id = pw.program_id
    WHERE pw.id = sessions.week_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ));

-- Allow athletes to manage program_weeks in self-guided programs
CREATE POLICY "Athletes can manage weeks in self-guided programs"
  ON public.program_weeks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = program_weeks.program_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = program_weeks.program_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ));

-- Allow athletes to manage session_sections in self-guided programs
CREATE POLICY "Athletes can manage sections in self-guided programs"
  ON public.session_sections
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    JOIN program_weeks pw ON pw.id = s.week_id
    JOIN programs p ON p.id = pw.program_id
    WHERE s.id = session_sections.session_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    JOIN program_weeks pw ON pw.id = s.week_id
    JOIN programs p ON p.id = pw.program_id
    WHERE s.id = session_sections.session_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ));

-- Allow athletes to manage session_exercises in self-guided programs
CREATE POLICY "Athletes can manage exercises in self-guided programs"
  ON public.session_exercises
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions s
    JOIN program_weeks pw ON pw.id = s.week_id
    JOIN programs p ON p.id = pw.program_id
    WHERE s.id = session_exercises.session_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions s
    JOIN program_weeks pw ON pw.id = s.week_id
    JOIN programs p ON p.id = pw.program_id
    WHERE s.id = session_exercises.session_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ));

-- Allow athletes to delete their self-guided programs
CREATE POLICY "Athletes can delete self-guided programs"
  ON public.programs
  FOR DELETE
  TO authenticated
  USING (student_id = auth.uid() AND coach_id IS NULL);

-- Allow athletes to manage program_progression in self-guided programs
CREATE POLICY "Athletes can manage progression in self-guided programs"
  ON public.program_progression
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = program_progression.program_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = program_progression.program_id AND p.student_id = auth.uid() AND p.coach_id IS NULL
  ));
