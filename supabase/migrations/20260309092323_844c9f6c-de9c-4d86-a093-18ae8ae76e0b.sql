
-- Coach invite tokens table
CREATE TABLE public.coach_invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  label text,
  uses_count integer NOT NULL DEFAULT 0,
  max_uses integer, -- NULL = unlimited
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

-- RLS
ALTER TABLE public.coach_invite_tokens ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own tokens
CREATE POLICY "Coaches can manage their tokens"
  ON public.coach_invite_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Anyone authenticated can read active tokens (for join flow)
CREATE POLICY "Anyone can read active tokens"
  ON public.coach_invite_tokens
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Public can read active tokens (for unauthenticated join redirect)
CREATE POLICY "Public can read active tokens for join"
  ON public.coach_invite_tokens
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Admins can view all tokens
CREATE POLICY "Admins can view all tokens"
  ON public.coach_invite_tokens
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
