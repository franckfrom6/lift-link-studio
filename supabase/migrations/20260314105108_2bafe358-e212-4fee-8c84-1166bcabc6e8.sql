-- Create exercise-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-photos', 'exercise-photos', true);

-- RLS for exercise-photos bucket
CREATE POLICY "Users can upload exercise photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'exercise-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view exercise photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'exercise-photos');

CREATE POLICY "Users can delete own exercise photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'exercise-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
