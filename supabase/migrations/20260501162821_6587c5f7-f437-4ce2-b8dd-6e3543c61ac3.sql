-- Activity log for nutrition meal plans
CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  actor_role text NOT NULL CHECK (actor_role IN ('coach', 'athlete')),
  action_type text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('plan', 'meal', 'meal_food')),
  entity_id uuid,
  before_value jsonb,
  after_value jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_plan_created ON public.activity_log (plan_id, created_at DESC);
CREATE INDEX idx_activity_log_actor ON public.activity_log (actor_id);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Read: coach or athlete of the plan
CREATE POLICY "Activity log readable by plan participants"
ON public.activity_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.meal_plans p
    WHERE p.id = activity_log.plan_id
      AND (
        p.coach_id = auth.uid()
        OR p.student_id = auth.uid()
      )
  )
);

-- Insert: actor must be self, and must have write access to the plan
CREATE POLICY "Users log their own actions on accessible plans"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.meal_plans p
    WHERE p.id = activity_log.plan_id
      AND (
        p.coach_id = auth.uid()
        OR (
          p.student_id = auth.uid()
          AND (p.athlete_can_edit = true OR p.coach_id IS NULL)
        )
      )
  )
);

-- No UPDATE / DELETE policies = immutable log

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_log;