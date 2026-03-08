
-- Coach nutrition recommendations
CREATE TABLE public.coach_nutrition_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  student_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  trigger_type text DEFAULT 'always',
  trigger_config jsonb,
  is_active boolean NOT NULL DEFAULT true,
  priority smallint NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Coach recovery recommendations
CREATE TABLE public.coach_recovery_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  student_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'stretching',
  trigger_type text DEFAULT 'always',
  trigger_config jsonb,
  video_url text,
  duration_minutes integer,
  is_active boolean NOT NULL DEFAULT true,
  priority smallint NOT NULL DEFAULT 2,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coach_nutrition_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_recovery_recommendations ENABLE ROW LEVEL SECURITY;

-- Coach CRUD own nutrition recommendations
CREATE POLICY "Coaches can manage their nutrition recommendations"
  ON public.coach_nutrition_recommendations FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Students can read their coach's nutrition recommendations (global + targeted)
CREATE POLICY "Students can view coach nutrition recommendations"
  ON public.coach_nutrition_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coach_students cs
      WHERE cs.student_id = auth.uid()
        AND cs.coach_id = coach_nutrition_recommendations.coach_id
        AND cs.status = 'active'
    )
    AND (coach_nutrition_recommendations.student_id IS NULL OR coach_nutrition_recommendations.student_id = auth.uid())
    AND coach_nutrition_recommendations.is_active = true
  );

-- Coach CRUD own recovery recommendations
CREATE POLICY "Coaches can manage their recovery recommendations"
  ON public.coach_recovery_recommendations FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Students can read their coach's recovery recommendations
CREATE POLICY "Students can view coach recovery recommendations"
  ON public.coach_recovery_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coach_students cs
      WHERE cs.student_id = auth.uid()
        AND cs.coach_id = coach_recovery_recommendations.coach_id
        AND cs.status = 'active'
    )
    AND (coach_recovery_recommendations.student_id IS NULL OR coach_recovery_recommendations.student_id = auth.uid())
    AND coach_recovery_recommendations.is_active = true
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_nutrition_recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.coach_recovery_recommendations;

-- Updated_at triggers
CREATE TRIGGER update_coach_nutrition_reco_updated_at
  BEFORE UPDATE ON public.coach_nutrition_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coach_recovery_reco_updated_at
  BEFORE UPDATE ON public.coach_recovery_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
