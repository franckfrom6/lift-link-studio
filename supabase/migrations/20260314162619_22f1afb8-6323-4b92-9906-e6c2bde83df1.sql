
-- Add soft-delete columns to sessions
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create policy: athletes can soft-delete their own program sessions (not completed ones)
CREATE POLICY "athlete_can_soft_delete_sessions" ON sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM program_weeks pw
      JOIN programs p ON p.id = pw.program_id
      WHERE pw.id = sessions.week_id
        AND p.student_id = auth.uid()
    )
    AND NOT EXISTS (
      SELECT 1 FROM completed_sessions cs
      WHERE cs.session_id = sessions.id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_weeks pw
      JOIN programs p ON p.id = pw.program_id
      WHERE pw.id = sessions.week_id
        AND p.student_id = auth.uid()
    )
  );
