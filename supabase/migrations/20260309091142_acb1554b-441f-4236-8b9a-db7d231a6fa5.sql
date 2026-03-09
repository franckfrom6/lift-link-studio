
-- Fix 1: Add tracking_type to exercises and duration_seconds to completed_sets
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS tracking_type text DEFAULT 'weight_reps';
ALTER TABLE public.completed_sets ADD COLUMN IF NOT EXISTS duration_seconds integer;

-- Fix 3: Make programs.coach_id nullable + add is_ai_generated
ALTER TABLE public.programs ALTER COLUMN coach_id DROP NOT NULL;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false;

-- RLS: Allow athletes to CRUD their own programs when coach_id IS NULL
CREATE POLICY "Athletes can read their own self-guided programs"
ON public.programs FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Athletes can insert self-guided programs"
ON public.programs FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid() AND coach_id IS NULL);

CREATE POLICY "Athletes can update their self-guided programs"
ON public.programs FOR UPDATE
TO authenticated
USING (student_id = auth.uid() AND coach_id IS NULL);

-- RLS: Admin can manage coach_students for all users
CREATE POLICY "Admins can insert coach_students"
ON public.coach_students FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can update coach_students"
ON public.coach_students FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);
