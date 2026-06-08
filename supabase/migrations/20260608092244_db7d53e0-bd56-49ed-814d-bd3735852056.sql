-- Deduplicate: keep the most recently created row per (session, exercise, set_number)
DELETE FROM public.completed_sets a
USING public.completed_sets b
WHERE a.completed_session_id = b.completed_session_id
  AND a.session_exercise_id = b.session_exercise_id
  AND a.set_number = b.set_number
  AND (a.created_at < b.created_at
       OR (a.created_at = b.created_at AND a.id < b.id));

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'completed_sets_unique_set'
  ) THEN
    ALTER TABLE public.completed_sets
      ADD CONSTRAINT completed_sets_unique_set
      UNIQUE (completed_session_id, session_exercise_id, set_number);
  END IF;
END $$;