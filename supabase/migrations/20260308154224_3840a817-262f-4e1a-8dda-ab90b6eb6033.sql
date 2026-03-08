
-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Create security definer function for admin check
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND is_admin = true
  )
$$;

-- Admin can read all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (public.is_admin(auth.uid()));

-- Admin policies for plan_features (CUD)
CREATE POLICY "Admins can insert plan_features" ON public.plan_features
FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update plan_features" ON public.plan_features
FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete plan_features" ON public.plan_features
FOR DELETE USING (public.is_admin(auth.uid()));
