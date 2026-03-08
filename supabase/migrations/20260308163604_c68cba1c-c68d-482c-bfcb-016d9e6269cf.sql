
-- Add onboarding_completed to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Make role nullable for new signups (role chosen during onboarding)
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- Create pending_invitations table
CREATE TABLE public.pending_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  email text NOT NULL,
  student_name text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their invitations
CREATE POLICY "Coaches can manage their invitations"
  ON public.pending_invitations FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Function to auto-associate pending invitations on profile creation
CREATE OR REPLACE FUNCTION public.process_pending_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
  user_email text;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
  
  IF user_email IS NOT NULL THEN
    FOR inv IN
      SELECT * FROM public.pending_invitations
      WHERE email = user_email AND status = 'pending'
    LOOP
      -- Create coach-student association
      INSERT INTO public.coach_students (coach_id, student_id, status)
      VALUES (inv.coach_id, NEW.user_id, 'active')
      ON CONFLICT DO NOTHING;
      
      -- Mark invitation as accepted
      UPDATE public.pending_invitations SET status = 'accepted' WHERE id = inv.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on profile insert
CREATE TRIGGER on_profile_created_process_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.process_pending_invitations();
