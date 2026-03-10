-- Allow athletes to manage session_sections in their free sessions
CREATE POLICY "Athletes can manage sections in free sessions"
ON public.session_sections
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_sections.session_id
      AND s.is_free_session = true
      AND s.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM sessions s
    WHERE s.id = session_sections.session_id
      AND s.is_free_session = true
      AND s.created_by = auth.uid()
  )
);