ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_steps JSONB DEFAULT '{}'::jsonb;