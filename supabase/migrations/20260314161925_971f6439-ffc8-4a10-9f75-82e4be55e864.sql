
CREATE TABLE public.pilot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('coach', 'athlete')),
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pilot_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a pilot request (no auth required)
CREATE POLICY "Anyone can insert pilot requests"
ON public.pilot_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view pilot requests
CREATE POLICY "Admins can view pilot requests"
ON public.pilot_requests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Only admins can update pilot requests
CREATE POLICY "Admins can update pilot requests"
ON public.pilot_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
