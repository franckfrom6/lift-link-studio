
CREATE TABLE IF NOT EXISTS public.impersonation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  student_id uuid NOT NULL,
  event text NOT NULL CHECK (event IN ('start','stop')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_impersonation_audit_coach ON public.impersonation_audit(coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impersonation_audit_student ON public.impersonation_audit(student_id, created_at DESC);

ALTER TABLE public.impersonation_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can insert their own impersonation events"
  ON public.impersonation_audit FOR INSERT TO authenticated
  WITH CHECK (
    coach_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.coach_students cs
      WHERE cs.coach_id = auth.uid()
        AND cs.student_id = impersonation_audit.student_id
        AND cs.status = 'active'
    )
  );

CREATE POLICY "Coaches can view their own impersonation events"
  ON public.impersonation_audit FOR SELECT TO authenticated
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can view all impersonation events"
  ON public.impersonation_audit FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
