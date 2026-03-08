
-- Nutrition profiles
CREATE TABLE public.nutrition_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  height_cm integer,
  weight_kg numeric,
  age integer,
  sex text,
  activity_multiplier numeric DEFAULT 1.55,
  objective text DEFAULT 'maintenance',
  bmr integer,
  tdee integer,
  calorie_target integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  dietary_restrictions text[] DEFAULT '{}',
  allergies text[] DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  UNIQUE(student_id)
);

ALTER TABLE public.nutrition_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their nutrition profile"
  ON public.nutrition_profiles FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view student nutrition profiles"
  ON public.nutrition_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_students cs
    WHERE cs.coach_id = auth.uid() AND cs.student_id = nutrition_profiles.student_id AND cs.status = 'active'
  ));

CREATE POLICY "Coaches can update student nutrition profiles"
  ON public.nutrition_profiles FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_students cs
    WHERE cs.coach_id = auth.uid() AND cs.student_id = nutrition_profiles.student_id AND cs.status = 'active'
  ));

-- Daily nutrition logs
CREATE TABLE public.daily_nutrition_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL,
  meal_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  calories integer,
  protein_g integer,
  carbs_g integer,
  fat_g integer,
  photo_url text,
  notes text,
  coach_comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_nutrition_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their nutrition logs"
  ON public.daily_nutrition_logs FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view student nutrition logs"
  ON public.daily_nutrition_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM coach_students cs
    WHERE cs.coach_id = auth.uid() AND cs.student_id = daily_nutrition_logs.student_id AND cs.status = 'active'
  ));

-- Recovery recommendations (seed data table)
CREATE TABLE public.recovery_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type text NOT NULL,
  activity_type text,
  muscle_groups text[] DEFAULT '{}',
  recommendation_type text NOT NULL,
  title_fr text NOT NULL,
  title_en text NOT NULL,
  content_fr text NOT NULL,
  content_en text NOT NULL,
  priority smallint NOT NULL DEFAULT 2
);

ALTER TABLE public.recovery_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read recommendations"
  ON public.recovery_recommendations FOR SELECT TO authenticated
  USING (true);

-- Storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);

CREATE POLICY "Students can upload meal photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students can view own meal photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Coaches can view student meal photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'meal-photos' AND EXISTS (
    SELECT 1 FROM coach_students cs
    WHERE cs.coach_id = auth.uid() AND cs.student_id::text = (storage.foldername(name))[1] AND cs.status = 'active'
  ));

CREATE POLICY "Public can view meal photos"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'meal-photos');

-- Seed recovery recommendations
INSERT INTO public.recovery_recommendations (trigger_type, activity_type, muscle_groups, recommendation_type, title_fr, title_en, content_fr, content_en, priority) VALUES
-- Post lower body
('post_session', NULL, '{"glutes","quads","hamstrings"}', 'nutrition', '🥤 Nutrition post lower body', '🥤 Post lower body nutrition', '30-40g de protéines + 50-80g de glucides dans les 2h post-training. Exemple : poulet + riz ou shaker + banane.', '30-40g protein + 50-80g carbs within 2h post-training. Example: chicken + rice or shake + banana.', 1),
('post_session', NULL, '{"glutes","quads","hamstrings"}', 'recovery', '🧊 Récupération lower body', '🧊 Lower body recovery', 'Foam rolling fessiers et ischios, 5 min. Étirements statiques hanche et quadriceps.', 'Foam rolling glutes and hamstrings, 5 min. Static stretching for hips and quads.', 1),
('post_session', NULL, '{"glutes","quads","hamstrings"}', 'sleep', '😴 Sommeil & récupération', '😴 Sleep & recovery', 'Vise 7-8h de sommeil. La synthèse protéique est maximale pendant le sommeil profond.', 'Aim for 7-8h of sleep. Protein synthesis peaks during deep sleep.', 2),
-- Post upper body
('post_session', NULL, '{"chest","back","shoulders","biceps","triceps"}', 'nutrition', '🥤 Nutrition post upper body', '🥤 Post upper body nutrition', '30-40g de protéines + 40-60g de glucides dans les 2h. Focus sur les acides aminés essentiels.', '30-40g protein + 40-60g carbs within 2h. Focus on essential amino acids.', 1),
('post_session', NULL, '{"chest","back","shoulders","biceps","triceps"}', 'recovery', '🧊 Récupération upper body', '🧊 Upper body recovery', 'Étirements pectoraux et épaules. Foam rolling thoracique. Mobilité rotation externe.', 'Chest and shoulder stretches. Thoracic foam rolling. External rotation mobility.', 1),
-- Post HIIT
('post_session', 'hiit', '{}', 'nutrition', '🥤 Post HIIT', '🥤 Post HIIT', 'Hydratation +500ml dans l''heure. Repas complet dans les 2h avec protéines et glucides.', 'Hydrate +500ml within the hour. Complete meal within 2h with protein and carbs.', 1),
('post_session', 'hiit', '{}', 'recovery', '🧊 Récupération HIIT', '🧊 HIIT recovery', 'Marche légère 10-15 min pour le retour au calme. Évite un entraînement intense dans les 24h.', 'Light walk 10-15 min to cool down. Avoid intense training for 24h.', 1),
-- Post Cycling
('post_session', 'cycling', '{}', 'nutrition', '🥤 Post Cycling', '🥤 Post Cycling', 'Recharge glucidique prioritaire. Banane + shaker protéiné en collation rapide.', 'Prioritize carb reload. Banana + protein shake as a quick snack.', 1),
('post_session', 'cycling', '{}', 'recovery', '🦵 Récupération Cycling', '🦵 Cycling recovery', 'Étirements quadriceps et fléchisseurs de hanche. Foam rolling IT band.', 'Quad and hip flexor stretches. IT band foam rolling.', 1),
-- Post Pilates/Yoga
('post_session', 'pilates', '{}', 'nutrition', '🥤 Post Pilates', '🥤 Post Pilates', 'Repas normal, pas de besoin spécifique post-séance. Hydratation normale.', 'Normal meal, no specific post-session needs. Normal hydration.', 3),
('post_session', 'yoga', '{}', 'recovery', '🧘 Post Yoga', '🧘 Post Yoga', 'Bonne séance de récupération active ! Hydratation et alimentation normale.', 'Great active recovery session! Normal hydration and nutrition.', 3),
-- Post Running
('post_session', 'running', '{}', 'nutrition', '🥤 Post Running', '🥤 Post Running', 'Hydratation prioritaire (+500ml). Glucides rapides + protéines dans les 30 min si > 60 min de course.', 'Hydration first (+500ml). Quick carbs + protein within 30 min if > 60 min run.', 1),
('post_session', 'running', '{}', 'recovery', '🦵 Récupération Running', '🦵 Running recovery', 'Étirements mollets, ischios, fléchisseurs hanche. Foam rolling IT band et quadriceps.', 'Calf, hamstring, hip flexor stretches. IT band and quad foam rolling.', 1),
-- Post Boxing/Bootcamp
('post_session', 'boxing', '{}', 'nutrition', '🥤 Post Boxing', '🥤 Post Boxing', 'Hydratation +++. Repas complet riche en protéines dans les 2h.', 'Hydrate +++. Complete protein-rich meal within 2h.', 1),
('post_session', 'bootcamp', '{}', 'recovery', '🧊 Post Bootcamp', '🧊 Post Bootcamp', 'Retour au calme progressif. Étirements full body. Évite un training intense dans les 24h.', 'Progressive cool down. Full body stretches. Avoid intense training for 24h.', 1),
-- High fatigue
('high_fatigue', NULL, '{}', 'recovery', '⚠️ Fatigue élevée', '⚠️ High fatigue', 'Priorise le sommeil cette semaine. Réduis l''intensité de 20-30%. Alimentation anti-inflammatoire (oméga-3, légumes, fruits).', 'Prioritize sleep this week. Reduce intensity by 20-30%. Anti-inflammatory diet (omega-3, vegetables, fruits).', 1),
('high_fatigue', NULL, '{}', 'nutrition', '🍎 Nutrition anti-fatigue', '🍎 Anti-fatigue nutrition', 'Augmente tes apports en oméga-3 (poisson gras, noix). Privilégie les aliments riches en magnésium et fer.', 'Increase omega-3 intake (fatty fish, nuts). Prioritize magnesium and iron-rich foods.', 1),
('high_fatigue', NULL, '{}', 'sleep', '😴 Sommeil prioritaire', '😴 Sleep priority', 'Objectif 8-9h de sommeil. Évite les écrans 1h avant le coucher. Température de la chambre : 18-19°C.', 'Aim for 8-9h sleep. Avoid screens 1h before bed. Room temperature: 18-19°C.', 1),
-- Deload
('deload_week', NULL, '{}', 'recovery', '🔄 Semaine de deload', '🔄 Deload week', 'Réduis le volume de 40-50% et l''intensité de 10-20%. C''est le moment de récupérer pour mieux progresser.', 'Reduce volume by 40-50% and intensity by 10-20%. Time to recover to progress better.', 1),
('deload_week', NULL, '{}', 'mobility', '🧘 Mobilité deload', '🧘 Deload mobility', 'Profite de cette semaine pour travailler ta mobilité : hanches, épaules, thoracique. 15-20 min/jour.', 'Use this week to work on mobility: hips, shoulders, thoracic. 15-20 min/day.', 2);
