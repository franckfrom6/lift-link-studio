
-- Allow students to insert themselves into coach_students (for token-based join)
CREATE POLICY "Students can join a coach"
  ON public.coach_students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id AND status = 'active');

-- Allow authenticated users to update token uses_count on tokens they're joining
CREATE POLICY "Users can increment token uses"
  ON public.coach_invite_tokens
  FOR UPDATE
  TO authenticated
  USING (is_active = true)
  WITH CHECK (is_active = true);
