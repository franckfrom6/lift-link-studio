ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS week_start text NOT NULL DEFAULT 'monday',
  ADD COLUMN IF NOT EXISTS rest_timer_sound boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_start_timer boolean NOT NULL DEFAULT true;