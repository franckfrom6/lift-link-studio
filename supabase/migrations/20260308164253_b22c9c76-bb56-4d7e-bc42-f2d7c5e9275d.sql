
-- AI usage logging table
CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  plan text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  duration_ms integer,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON public.ai_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI usage"
  ON public.ai_usage_logs FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Edge function needs insert via service role, no INSERT policy needed for users
CREATE INDEX idx_ai_usage_user_action ON public.ai_usage_logs (user_id, action, created_at);
