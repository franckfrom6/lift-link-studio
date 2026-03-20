
-- Update RLS policies on exercises for custom coach exercises

-- Drop existing policies that need updating
DROP POLICY IF EXISTS "Everyone can view default exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can view own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can create exercises" ON public.exercises;
DROP POLICY IF EXISTS "Coaches can update own exercises" ON public.exercises;

-- SELECT: everyone sees default exercises + coaches see their own + students see their coach's exercises
CREATE POLICY "Everyone can view default exercises"
ON public.exercises FOR SELECT
USING (is_default = true);

CREATE POLICY "Coaches can view own custom exercises"
ON public.exercises FOR SELECT TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Students can view coach custom exercises"
ON public.exercises FOR SELECT TO authenticated
USING (
  created_by IN (
    SELECT cs.coach_id FROM public.coach_students cs 
    WHERE cs.student_id = auth.uid() AND cs.status = 'active'
  )
);

-- INSERT: only coaches, created_by must be auth.uid(), is_default must be false
CREATE POLICY "Coaches can create custom exercises"
ON public.exercises FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'coach') 
  AND created_by = auth.uid() 
  AND is_default = false
);

-- UPDATE: only own custom exercises
CREATE POLICY "Coaches can update own custom exercises"
ON public.exercises FOR UPDATE TO authenticated
USING (created_by = auth.uid() AND is_default = false);

-- DELETE: only own custom exercises  
CREATE POLICY "Coaches can delete own custom exercises"
ON public.exercises FOR DELETE TO authenticated
USING (created_by = auth.uid() AND is_default = false);
