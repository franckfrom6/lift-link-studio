-- Fix RLS function: only consider sessions with completed_at as truly completed
CREATE OR REPLACE FUNCTION public.session_is_completed(_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.completed_sessions 
    WHERE session_id = _session_id AND completed_at IS NOT NULL
  )
$$;