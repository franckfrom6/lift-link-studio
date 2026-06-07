
-- 1. Add DELETE policy for service_role on email_unsubscribe_tokens
CREATE POLICY "Service role can delete unsubscribe tokens"
ON public.email_unsubscribe_tokens
FOR DELETE
TO service_role
USING (true);

-- 2. Add UPDATE storage policy for progress-photos bucket scoped to owner
CREATE POLICY "Users can update their own progress photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
