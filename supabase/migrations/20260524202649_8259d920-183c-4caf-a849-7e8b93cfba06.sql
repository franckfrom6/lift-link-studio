
-- 1. Coach invite tokens: server-side RPCs + tighter RLS
CREATE OR REPLACE FUNCTION public.lookup_coach_invite_token(_token text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coach_id FROM public.coach_invite_tokens
  WHERE token = upper(_token)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.redeem_coach_invite_token(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token RECORD;
  v_user uuid := auth.uid();
  v_existing uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthenticated');
  END IF;

  SELECT id, coach_id, expires_at, max_uses, uses_count
    INTO v_token
  FROM public.coach_invite_tokens
  WHERE token = upper(_token)
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;
  IF v_token.expires_at IS NOT NULL AND v_token.expires_at < now() THEN
    RETURN jsonb_build_object('status', 'expired');
  END IF;
  IF v_token.max_uses IS NOT NULL AND v_token.uses_count >= v_token.max_uses THEN
    RETURN jsonb_build_object('status', 'maxed');
  END IF;

  SELECT id INTO v_existing
  FROM public.coach_students
  WHERE coach_id = v_token.coach_id
    AND student_id = v_user
    AND status = 'active'
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_linked', 'coach_id', v_token.coach_id);
  END IF;

  INSERT INTO public.coach_students (coach_id, student_id, status)
  VALUES (v_token.coach_id, v_user, 'active');

  UPDATE public.coach_invite_tokens
  SET uses_count = uses_count + 1
  WHERE id = v_token.id;

  RETURN jsonb_build_object('status', 'success', 'coach_id', v_token.coach_id);
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_coach_invite_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_coach_invite_token(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.redeem_coach_invite_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_coach_invite_token(text) TO authenticated;

DROP POLICY IF EXISTS "Anyone can read active tokens" ON public.coach_invite_tokens;
DROP POLICY IF EXISTS "Public can read active tokens for join" ON public.coach_invite_tokens;
DROP POLICY IF EXISTS "Users can increment token uses" ON public.coach_invite_tokens;

-- 2. Storage: meal-photos DELETE + UPDATE for owners
CREATE POLICY "Students can delete own meal photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Students can update own meal photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Storage: support-attachments DELETE for owners
CREATE POLICY "Users can delete own support attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. suppressed_emails: allow service_role to delete entries
CREATE POLICY "Service role can delete suppressed emails"
ON public.suppressed_emails FOR DELETE TO service_role
USING (true);

-- 5. Harden queue helper functions: pin search_path + revoke public exec
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.process_pending_invitations() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
