
-- Add INSERT policy for ai_usage_logs (RLS is already enabled, SELECT policies already exist)
CREATE POLICY "Users can insert own AI usage"
  ON public.ai_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
