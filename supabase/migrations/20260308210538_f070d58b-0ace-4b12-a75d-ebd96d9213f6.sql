
-- Fix user_subscriptions: use is_admin instead of role='coach'
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
  ON public.user_subscriptions
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Fix feature_overrides: use is_admin instead of role='coach'
DROP POLICY IF EXISTS "Admins can manage all overrides" ON public.feature_overrides;
CREATE POLICY "Admins can manage all overrides"
  ON public.feature_overrides
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true));
