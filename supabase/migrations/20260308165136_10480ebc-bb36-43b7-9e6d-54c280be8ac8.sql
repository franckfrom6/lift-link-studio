
-- Fix ai_usage_logs RLS: change from RESTRICTIVE to PERMISSIVE
DROP POLICY IF EXISTS "Admins can view all AI usage" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Users can view own AI usage" ON public.ai_usage_logs;

CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI usage"
  ON public.ai_usage_logs FOR SELECT
  USING (is_admin(auth.uid()));
