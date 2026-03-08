
-- Body measurements table
CREATE TABLE public.body_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL,
  weight_kg numeric NULL,
  body_fat_pct numeric NULL,
  chest_cm numeric NULL,
  waist_cm numeric NULL,
  hips_cm numeric NULL,
  thigh_cm numeric NULL,
  arm_cm numeric NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their measurements" ON public.body_measurements
  FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view student measurements" ON public.body_measurements
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM coach_students cs WHERE cs.coach_id = auth.uid() AND cs.student_id = body_measurements.student_id AND cs.status = 'active')
  );

CREATE POLICY "Coaches can insert student measurements" ON public.body_measurements
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM coach_students cs WHERE cs.coach_id = auth.uid() AND cs.student_id = body_measurements.student_id AND cs.status = 'active')
  );

-- Progress photos table
CREATE TABLE public.progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  date date NOT NULL,
  photo_url text NOT NULL,
  category text NOT NULL DEFAULT 'front',
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their photos" ON public.progress_photos
  FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Coaches can view student photos" ON public.progress_photos
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM coach_students cs WHERE cs.coach_id = auth.uid() AND cs.student_id = progress_photos.student_id AND cs.status = 'active')
  );

-- Progress photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', true);

CREATE POLICY "Students can upload progress photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view progress photos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'progress-photos');

CREATE POLICY "Students can delete own progress photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'progress-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
