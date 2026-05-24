ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_session_type_check;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS hybrid_blocks jsonb;
ALTER TABLE public.sessions ADD CONSTRAINT sessions_session_type_check CHECK (session_type IN ('strength', 'running', 'hybrid'));

ALTER TABLE public.completed_sessions
  ADD COLUMN IF NOT EXISTS global_rpe integer CHECK (global_rpe BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS sensation_tag text CHECK (sensation_tag IN ('easy', 'solid', 'hard', 'cooked')),
  ADD COLUMN IF NOT EXISTS notes_for_coach text;

CREATE TABLE IF NOT EXISTS public.hybrid_block_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completed_session_id uuid NOT NULL REFERENCES public.completed_sessions(id) ON DELETE CASCADE,
  block_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('done', 'partial', 'skipped')),
  skip_reason text,
  log_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hybrid_block_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Athletes manage their own block executions"
  ON public.hybrid_block_executions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.completed_sessions cs
      WHERE cs.id = hybrid_block_executions.completed_session_id
        AND cs.student_id = auth.uid()
    )
  );