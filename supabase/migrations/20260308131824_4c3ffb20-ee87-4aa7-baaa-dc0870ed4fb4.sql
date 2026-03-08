
-- 1. session_sections table
CREATE TABLE public.session_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  sort_order integer NOT NULL DEFAULT 0,
  duration_estimate text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_sections ENABLE ROW LEVEL SECURITY;

-- RLS: Coaches can manage sections
CREATE POLICY "Coaches can manage session sections" ON public.session_sections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN program_weeks pw ON pw.id = s.week_id
    JOIN programs p ON p.id = pw.program_id
    WHERE s.id = session_sections.session_id AND p.coach_id = auth.uid()
  )
);

-- RLS: Students can view their session sections
CREATE POLICY "Students can view their session sections" ON public.session_sections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM sessions s
    JOIN program_weeks pw ON pw.id = s.week_id
    JOIN programs p ON p.id = pw.program_id
    WHERE s.id = session_sections.session_id AND p.student_id = auth.uid()
  )
);

-- 2. Add section_id to session_exercises
ALTER TABLE public.session_exercises ADD COLUMN section_id uuid REFERENCES public.session_sections(id) ON DELETE SET NULL;

-- 3. Add enriched columns to session_exercises
ALTER TABLE public.session_exercises ADD COLUMN tempo text;
ALTER TABLE public.session_exercises ADD COLUMN rpe_target text;
ALTER TABLE public.session_exercises ADD COLUMN video_url text;
ALTER TABLE public.session_exercises ADD COLUMN video_search_query text;

-- 4. Add rpe_actual to completed_sets
ALTER TABLE public.completed_sets ADD COLUMN rpe_actual smallint;

-- 5. program_progression table
CREATE TABLE public.program_progression (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  week_label text NOT NULL,
  description text NOT NULL,
  week_start integer NOT NULL,
  week_end integer NOT NULL,
  is_deload boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.program_progression ENABLE ROW LEVEL SECURITY;

-- RLS: Coaches can manage progression
CREATE POLICY "Coaches can manage progression" ON public.program_progression
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = program_progression.program_id AND p.coach_id = auth.uid()
  )
);

-- RLS: Students can view their progression
CREATE POLICY "Students can view their progression" ON public.program_progression
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM programs p
    WHERE p.id = program_progression.program_id AND p.student_id = auth.uid()
  )
);
