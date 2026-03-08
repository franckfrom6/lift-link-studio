
-- Plans table
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name_fr text NOT NULL,
  display_name_en text NOT NULL,
  price_monthly decimal,
  price_yearly decimal,
  description_fr text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read plans" ON public.plans FOR SELECT USING (true);

-- Plan features
CREATE TABLE public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES public.plans(id) ON DELETE CASCADE NOT NULL,
  feature_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  limit_value integer,
  limit_type text,
  UNIQUE(plan_id, feature_key)
);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can read plan_features" ON public.plan_features FOR SELECT USING (true);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_id uuid REFERENCES public.plans(id) NOT NULL,
  status text NOT NULL DEFAULT 'active',
  trial_ends_at timestamptz,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT (now() + interval '100 years'),
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'coach')
);

-- Feature overrides
CREATE TABLE public.feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  reason text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own overrides" ON public.feature_overrides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all overrides" ON public.feature_overrides FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'coach')
);

-- Seed plans
INSERT INTO public.plans (name, display_name_fr, display_name_en, price_monthly, price_yearly, description_fr, description_en, sort_order) VALUES
  ('free', 'Gratuit', 'Free', NULL, NULL, 'Pour découvrir l''app', 'Discover the app', 1),
  ('essential', 'Essentiel', 'Essential', 19, 182, 'Pour les coachs actifs', 'For active coaches', 2),
  ('advanced', 'Avancé', 'Advanced', 39, 374, 'Pour les coachs ambitieux', 'For ambitious coaches', 3);

-- Seed plan features
-- FREE plan
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled, limit_value, limit_type)
SELECT p.id, f.feature_key, f.is_enabled, f.limit_value, f.limit_type
FROM public.plans p
CROSS JOIN (VALUES
  ('max_clients', true, 5, 'max_count'),
  ('program_creation', true, NULL, NULL),
  ('exercise_library_custom', true, 10, 'max_count'),
  ('exercise_alternatives_manual', true, NULL, NULL),
  ('body_measurements', true, NULL, NULL),
  ('session_tracking', true, NULL, NULL),
  ('session_swap', true, NULL, NULL),
  ('exercise_substitution', true, NULL, NULL),
  ('external_sessions', true, NULL, NULL),
  ('weekly_checkin', true, NULL, NULL),
  ('recovery_recommendations', true, NULL, NULL),
  ('strength_charts', true, NULL, NULL),
  ('ai_program_generation', false, NULL, NULL),
  ('exercise_alternatives_ai', false, NULL, NULL),
  ('session_sections', false, NULL, NULL),
  ('coach_nutrition_recommendations', false, NULL, NULL),
  ('coach_recovery_recommendations', false, NULL, NULL),
  ('ai_week_analysis', false, NULL, NULL),
  ('ai_cycle_report', false, NULL, NULL),
  ('pdf_export', false, NULL, NULL),
  ('dashboard_advanced', false, NULL, NULL),
  ('client_progress_photos', false, NULL, NULL),
  ('ai_exercise_suggestion', false, NULL, NULL),
  ('ai_week_optimizer', false, NULL, NULL),
  ('nutrition_tracking', false, NULL, NULL),
  ('ai_macro_estimation', false, NULL, NULL),
  ('ai_meal_suggestion', false, NULL, NULL),
  ('ai_recovery_recommendations', false, NULL, NULL),
  ('ai_weekly_insight', false, NULL, NULL),
  ('progress_photos', false, NULL, NULL)
) AS f(feature_key, is_enabled, limit_value, limit_type)
WHERE p.name = 'free';

-- ESSENTIAL plan
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled, limit_value, limit_type)
SELECT p.id, f.feature_key, f.is_enabled, f.limit_value, f.limit_type
FROM public.plans p
CROSS JOIN (VALUES
  ('max_clients', true, 15, 'max_count'),
  ('program_creation', true, NULL, NULL),
  ('exercise_library_custom', true, 50, 'max_count'),
  ('exercise_alternatives_manual', true, NULL, NULL),
  ('body_measurements', true, NULL, NULL),
  ('session_tracking', true, NULL, NULL),
  ('session_swap', true, NULL, NULL),
  ('exercise_substitution', true, NULL, NULL),
  ('external_sessions', true, NULL, NULL),
  ('weekly_checkin', true, NULL, NULL),
  ('recovery_recommendations', true, NULL, NULL),
  ('strength_charts', true, NULL, NULL),
  ('ai_program_generation', true, 5, 'monthly_count'),
  ('exercise_alternatives_ai', true, NULL, NULL),
  ('session_sections', true, NULL, NULL),
  ('coach_nutrition_recommendations', true, 10, 'max_count'),
  ('coach_recovery_recommendations', true, 10, 'max_count'),
  ('pdf_export', true, NULL, NULL),
  ('dashboard_advanced', true, NULL, NULL),
  ('client_progress_photos', true, NULL, NULL),
  ('ai_exercise_suggestion', true, NULL, NULL),
  ('nutrition_tracking', true, NULL, NULL),
  ('ai_recovery_recommendations', true, NULL, NULL),
  ('progress_photos', true, NULL, NULL),
  ('ai_week_analysis', false, NULL, NULL),
  ('ai_cycle_report', false, NULL, NULL),
  ('ai_week_optimizer', false, NULL, NULL),
  ('ai_macro_estimation', false, NULL, NULL),
  ('ai_meal_suggestion', false, NULL, NULL),
  ('ai_weekly_insight', false, NULL, NULL)
) AS f(feature_key, is_enabled, limit_value, limit_type)
WHERE p.name = 'essential';

-- ADVANCED plan
INSERT INTO public.plan_features (plan_id, feature_key, is_enabled, limit_value, limit_type)
SELECT p.id, f.feature_key, f.is_enabled, f.limit_value, f.limit_type
FROM public.plans p
CROSS JOIN (VALUES
  ('max_clients', true, NULL, NULL),
  ('program_creation', true, NULL, NULL),
  ('exercise_library_custom', true, NULL, NULL),
  ('exercise_alternatives_manual', true, NULL, NULL),
  ('body_measurements', true, NULL, NULL),
  ('session_tracking', true, NULL, NULL),
  ('session_swap', true, NULL, NULL),
  ('exercise_substitution', true, NULL, NULL),
  ('external_sessions', true, NULL, NULL),
  ('weekly_checkin', true, NULL, NULL),
  ('recovery_recommendations', true, NULL, NULL),
  ('strength_charts', true, NULL, NULL),
  ('ai_program_generation', true, 50, 'monthly_count'),
  ('exercise_alternatives_ai', true, NULL, NULL),
  ('session_sections', true, NULL, NULL),
  ('coach_nutrition_recommendations', true, NULL, NULL),
  ('coach_recovery_recommendations', true, NULL, NULL),
  ('ai_week_analysis', true, NULL, NULL),
  ('ai_cycle_report', true, NULL, NULL),
  ('pdf_export', true, NULL, NULL),
  ('dashboard_advanced', true, NULL, NULL),
  ('client_progress_photos', true, NULL, NULL),
  ('ai_exercise_suggestion', true, NULL, NULL),
  ('ai_week_optimizer', true, NULL, NULL),
  ('nutrition_tracking', true, NULL, NULL),
  ('ai_macro_estimation', true, NULL, NULL),
  ('ai_meal_suggestion', true, NULL, NULL),
  ('ai_recovery_recommendations', true, NULL, NULL),
  ('ai_weekly_insight', true, NULL, NULL),
  ('progress_photos', true, NULL, NULL)
) AS f(feature_key, is_enabled, limit_value, limit_type)
WHERE p.name = 'advanced';

-- Trigger: auto-assign free plan on profile creation
CREATE OR REPLACE FUNCTION public.auto_assign_free_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id uuid;
BEGIN
  SELECT id INTO free_plan_id FROM public.plans WHERE name = 'free' LIMIT 1;
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    VALUES (NEW.user_id, free_plan_id, 'active')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_assign_plan
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_free_plan();
