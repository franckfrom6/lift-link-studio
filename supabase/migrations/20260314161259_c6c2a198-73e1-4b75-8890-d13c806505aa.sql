
CREATE TABLE public.video_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  suggested_by UUID NOT NULL,
  video_url TEXT NOT NULL,
  gender_target TEXT NOT NULL CHECK (gender_target IN ('female', 'male', 'both')),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.video_suggestions ENABLE ROW LEVEL SECURITY;

-- Coaches can insert their own suggestions
CREATE POLICY "Coaches can insert own suggestions"
ON public.video_suggestions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = suggested_by
  AND public.has_role(auth.uid(), 'coach')
);

-- Coaches can view their own suggestions
CREATE POLICY "Coaches can view own suggestions"
ON public.video_suggestions
FOR SELECT
TO authenticated
USING (auth.uid() = suggested_by);

-- Admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
ON public.video_suggestions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can update suggestion status
CREATE POLICY "Admins can update suggestions"
ON public.video_suggestions
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));
