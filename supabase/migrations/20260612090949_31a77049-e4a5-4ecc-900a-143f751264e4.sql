-- Drop plaintext OAuth token columns from strava_connections
ALTER TABLE public.strava_connections DROP COLUMN IF EXISTS access_token;
ALTER TABLE public.strava_connections DROP COLUMN IF EXISTS refresh_token;

-- Tighten session_exercises INSERT policy: restrict to self-guided programs only
DROP POLICY IF EXISTS "Athletes can insert exercises in their program sessions" ON public.session_exercises;
CREATE POLICY "Athletes can insert exercises in self-guided program sessions"
ON public.session_exercises
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM sessions s
    JOIN program_weeks pw ON pw.id = s.week_id
    JOIN programs p ON p.id = pw.program_id
    WHERE s.id = session_exercises.session_id
      AND p.student_id = auth.uid()
      AND p.coach_id IS NULL
  )
);