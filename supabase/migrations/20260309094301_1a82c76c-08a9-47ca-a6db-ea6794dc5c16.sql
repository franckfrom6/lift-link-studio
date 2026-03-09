
-- Feature 1: Shared Sessions (Teammate Workout)
CREATE TABLE public.shared_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  completed_session_id uuid NOT NULL REFERENCES public.completed_sessions(id) ON DELETE CASCADE,
  shared_with_user_id uuid NOT NULL,
  shared_completed_session_id uuid REFERENCES public.completed_sessions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_sessions ENABLE ROW LEVEL SECURITY;

-- Athlete can share with teammates of the same coach
CREATE POLICY "Athletes can create shares with same-coach teammates"
  ON public.shared_sessions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM completed_sessions cs
      WHERE cs.id = shared_sessions.completed_session_id
        AND cs.student_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM coach_students cs1
      JOIN coach_students cs2 ON cs1.coach_id = cs2.coach_id
      WHERE cs1.student_id = auth.uid()
        AND cs2.student_id = shared_sessions.shared_with_user_id
        AND cs1.status = 'active' AND cs2.status = 'active'
    )
  );

CREATE POLICY "Athletes can view their shares"
  ON public.shared_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM completed_sessions cs
      WHERE cs.id = shared_sessions.completed_session_id
        AND cs.student_id = auth.uid()
    )
    OR shared_with_user_id = auth.uid()
  );

CREATE POLICY "Athletes can update shares they received"
  ON public.shared_sessions FOR UPDATE TO authenticated
  USING (shared_with_user_id = auth.uid())
  WITH CHECK (shared_with_user_id = auth.uid());

CREATE POLICY "Coaches can view shares of their students"
  ON public.shared_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM completed_sessions cs
      JOIN coach_students rel ON rel.student_id = cs.student_id AND rel.coach_id = auth.uid() AND rel.status = 'active'
      WHERE cs.id = shared_sessions.completed_session_id
    )
  );

-- Feature 2: AI Chat Messages
CREATE TABLE public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  context_page text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat messages"
  ON public.ai_chat_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Feature 3: Coach Public Profiles
CREATE TABLE public.coach_profiles_public (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL UNIQUE,
  bio_fr text DEFAULT '',
  bio_en text DEFAULT '',
  specialties text[] DEFAULT '{}',
  location_city text,
  location_area text,
  training_locations text[] DEFAULT '{}',
  price_range text,
  is_accepting_clients boolean NOT NULL DEFAULT true,
  client_count integer NOT NULL DEFAULT 0,
  avg_rating numeric,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_profiles_public ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read public coach profiles"
  ON public.coach_profiles_public FOR SELECT
  USING (true);

CREATE POLICY "Coaches can manage their own public profile"
  ON public.coach_profiles_public FOR ALL TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Coach Recommendations (lead gen matching)
CREATE TABLE public.coach_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  match_score numeric NOT NULL DEFAULT 0,
  match_reasons text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their coach recommendations"
  ON public.coach_recommendations FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can update their coach recommendations"
  ON public.coach_recommendations FOR UPDATE TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view recommendations about them"
  ON public.coach_recommendations FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

-- Contact requests table
CREATE TABLE public.coach_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  message text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.coach_contact_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can create contact requests"
  ON public.coach_contact_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can view own contact requests"
  ON public.coach_contact_requests FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Coaches can view contact requests about them"
  ON public.coach_contact_requests FOR SELECT TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can update contact requests"
  ON public.coach_contact_requests FOR UPDATE TO authenticated
  USING (auth.uid() = coach_id);
