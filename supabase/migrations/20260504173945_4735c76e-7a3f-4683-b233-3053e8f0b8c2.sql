
-- ============================================================
-- SECURITY FIX 1: Lock down storage buckets for sensitive photos
-- ============================================================

-- Make buckets private (was: public = true)
UPDATE storage.buckets SET public = false WHERE id IN ('progress-photos', 'meal-photos');

-- Progress photos: drop the "anyone" policy, add owner + coach policies
DROP POLICY IF EXISTS "Anyone can view progress photos" ON storage.objects;

CREATE POLICY "Students can view own progress photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Coaches can view student progress photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND EXISTS (
      SELECT 1 FROM public.coach_students cs
      WHERE cs.coach_id = auth.uid()
        AND cs.student_id::text = (storage.foldername(name))[1]
        AND cs.status = 'active'
    )
  );

-- Meal photos: drop the public/anon policy
DROP POLICY IF EXISTS "Public can view meal photos" ON storage.objects;

-- ============================================================
-- SECURITY FIX 5: Encrypt Strava OAuth tokens at rest
-- We add bytea columns for encrypted storage and rely on edge
-- functions to encrypt/decrypt with STRAVA_TOKEN_KEY (AES-GCM).
-- Plaintext columns become nullable during transition; after the
-- first refresh cycle they will be cleared.
-- ============================================================

ALTER TABLE public.strava_connections
  ADD COLUMN IF NOT EXISTS access_token_enc  bytea,
  ADD COLUMN IF NOT EXISTS refresh_token_enc bytea;

ALTER TABLE public.strava_connections
  ALTER COLUMN access_token  DROP NOT NULL,
  ALTER COLUMN refresh_token DROP NOT NULL;
