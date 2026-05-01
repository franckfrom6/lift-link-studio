-- Replace the athlete UPDATE policy on meal_plans so that an athlete
-- cannot flip athlete_can_edit on themselves nor change coach_id.
DROP POLICY IF EXISTS "Athletes can update editable plans" ON public.meal_plans;

CREATE POLICY "Athletes can update editable plans"
ON public.meal_plans
FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid()
  AND (athlete_can_edit = true OR coach_id IS NULL)
)
WITH CHECK (
  student_id = auth.uid()
  AND (athlete_can_edit = true OR coach_id IS NULL)
  -- Lock down sensitive fields: only the coach (or self-guided owner)
  -- can change these. We compare new row to the existing one via a
  -- subselect because Postgres RLS doesn't expose OLD directly.
  AND coach_id IS NOT DISTINCT FROM (
    SELECT coach_id FROM public.meal_plans WHERE id = meal_plans.id
  )
  AND athlete_can_edit IS NOT DISTINCT FROM (
    SELECT athlete_can_edit FROM public.meal_plans WHERE id = meal_plans.id
  )
);