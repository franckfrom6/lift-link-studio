
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('coach', 'student');

-- Coach-Student relationship (created first for references)
CREATE TABLE public.coach_students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(coach_id, student_id)
);

ALTER TABLE public.coach_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can view their students" ON public.coach_students
  FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Students can view their coach" ON public.coach_students
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Coaches can manage relationships" ON public.coach_students
  FOR ALL USING (auth.uid() = coach_id);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  specialty TEXT,
  age INTEGER,
  height INTEGER,
  weight NUMERIC(5,1),
  goal TEXT,
  level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Coaches can view their students profiles" ON public.profiles
  FOR SELECT USING (
    public.has_role(auth.uid(), 'coach') AND
    EXISTS (
      SELECT 1 FROM public.coach_students cs
      WHERE cs.coach_id = auth.uid() AND cs.student_id = profiles.user_id AND cs.status = 'active'
    )
  );

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Exercises library
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  secondary_muscle TEXT,
  type TEXT NOT NULL CHECK (type IN ('compound', 'isolation')),
  equipment TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view default exercises" ON public.exercises
  FOR SELECT USING (is_default = true);

CREATE POLICY "Coaches can view own exercises" ON public.exercises
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Coaches can create exercises" ON public.exercises
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'coach'));

CREATE POLICY "Coaches can update own exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() = created_by);

-- Programs
CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their programs" ON public.programs
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Students can view their programs" ON public.programs
  FOR SELECT USING (auth.uid() = student_id);

-- Program weeks
CREATE TABLE public.program_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.program_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage weeks" ON public.program_weeks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND p.coach_id = auth.uid())
  );

CREATE POLICY "Students can view their weeks" ON public.program_weeks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND p.student_id = auth.uid())
  );

-- Sessions
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID NOT NULL REFERENCES public.program_weeks(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage sessions" ON public.sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.program_weeks pw
      JOIN public.programs p ON p.id = pw.program_id
      WHERE pw.id = week_id AND p.coach_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.program_weeks pw
      JOIN public.programs p ON p.id = pw.program_id
      WHERE pw.id = week_id AND p.student_id = auth.uid()
    )
  );

-- Session exercises
CREATE TABLE public.session_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id),
  sort_order INTEGER NOT NULL,
  sets INTEGER NOT NULL DEFAULT 3,
  reps_min INTEGER NOT NULL DEFAULT 8,
  reps_max INTEGER NOT NULL DEFAULT 12,
  rest_seconds INTEGER NOT NULL DEFAULT 90,
  suggested_weight NUMERIC(5,1),
  coach_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage session exercises" ON public.session_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.program_weeks pw ON pw.id = s.week_id
      JOIN public.programs p ON p.id = pw.program_id
      WHERE s.id = session_id AND p.coach_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their session exercises" ON public.session_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.program_weeks pw ON pw.id = s.week_id
      JOIN public.programs p ON p.id = pw.program_id
      WHERE s.id = session_id AND p.student_id = auth.uid()
    )
  );

-- Completed sessions
CREATE TABLE public.completed_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  student_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.completed_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their completed sessions" ON public.completed_sessions
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Coaches can view their students completed sessions" ON public.completed_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coach_students cs
      WHERE cs.coach_id = auth.uid() AND cs.student_id = completed_sessions.student_id AND cs.status = 'active'
    )
  );

-- Completed sets
CREATE TABLE public.completed_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  completed_session_id UUID NOT NULL REFERENCES public.completed_sessions(id) ON DELETE CASCADE,
  session_exercise_id UUID NOT NULL REFERENCES public.session_exercises(id),
  set_number INTEGER NOT NULL,
  weight NUMERIC(5,1),
  reps INTEGER NOT NULL,
  is_failure BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.completed_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their completed sets" ON public.completed_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.completed_sessions cs
      WHERE cs.id = completed_session_id AND cs.student_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can view their students completed sets" ON public.completed_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.completed_sessions cs
      JOIN public.coach_students rel ON rel.student_id = cs.student_id AND rel.coach_id = auth.uid()
      WHERE cs.id = completed_session_id AND rel.status = 'active'
    )
  );

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for completed_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.completed_sessions;

-- Seed default exercises
INSERT INTO public.exercises (name, muscle_group, secondary_muscle, type, equipment, description, is_default) VALUES
  ('Développé couché', 'Pectoraux', 'Triceps', 'compound', 'Barre', 'Exercice de base pour les pectoraux', true),
  ('Développé incliné', 'Pectoraux', 'Épaules', 'compound', 'Haltères', 'Cible la partie haute des pectoraux', true),
  ('Écarté couché', 'Pectoraux', NULL, 'isolation', 'Haltères', 'Isolation des pectoraux', true),
  ('Tractions', 'Dos', 'Biceps', 'compound', 'Poids du corps', 'Exercice de tirage vertical', true),
  ('Rowing barre', 'Dos', 'Biceps', 'compound', 'Barre', 'Tirage horizontal pour le dos', true),
  ('Tirage vertical', 'Dos', 'Biceps', 'compound', 'Câble', 'Alternative aux tractions', true),
  ('Développé militaire', 'Épaules', 'Triceps', 'compound', 'Barre', 'Exercice de base pour les épaules', true),
  ('Élévations latérales', 'Épaules', NULL, 'isolation', 'Haltères', 'Isolation du deltoïde moyen', true),
  ('Oiseau', 'Épaules', NULL, 'isolation', 'Haltères', 'Cible le deltoïde postérieur', true),
  ('Curl biceps', 'Bras', NULL, 'isolation', 'Haltères', 'Flexion des biceps', true),
  ('Extension triceps', 'Bras', NULL, 'isolation', 'Câble', 'Extension des triceps à la poulie', true),
  ('Curl marteau', 'Bras', NULL, 'isolation', 'Haltères', 'Cible le brachial et brachioradial', true),
  ('Squat', 'Jambes', 'Fessiers', 'compound', 'Barre', 'Exercice roi pour les jambes', true),
  ('Presse à cuisses', 'Jambes', 'Fessiers', 'compound', 'Machine', 'Alternative au squat', true),
  ('Leg extension', 'Jambes', NULL, 'isolation', 'Machine', 'Isolation des quadriceps', true),
  ('Leg curl', 'Jambes', NULL, 'isolation', 'Machine', 'Isolation des ischio-jambiers', true),
  ('Soulevé de terre', 'Dos', 'Jambes', 'compound', 'Barre', 'Exercice polyarticulaire complet', true),
  ('Hip thrust', 'Fessiers', 'Jambes', 'compound', 'Barre', 'Exercice principal pour les fessiers', true),
  ('Crunch', 'Abdos', NULL, 'isolation', 'Poids du corps', 'Flexion du tronc', true),
  ('Planche', 'Abdos', NULL, 'isolation', 'Poids du corps', 'Gainage isométrique', true),
  ('Dips', 'Pectoraux', 'Triceps', 'compound', 'Poids du corps', 'Exercice de poussée verticale', true),
  ('Rowing haltère', 'Dos', 'Biceps', 'compound', 'Haltères', 'Tirage unilatéral pour le dos', true),
  ('Fentes', 'Jambes', 'Fessiers', 'compound', 'Haltères', 'Exercice unilatéral pour les jambes', true),
  ('Mollets debout', 'Jambes', NULL, 'isolation', 'Machine', 'Extension des mollets', true);
