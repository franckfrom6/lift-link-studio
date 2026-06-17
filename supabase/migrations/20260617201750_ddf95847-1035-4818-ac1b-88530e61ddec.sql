CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nouvelle conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived boolean NOT NULL DEFAULT false
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own conversations"
  ON public.ai_conversations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE public.ai_chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid
  REFERENCES public.ai_conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_conversation
  ON public.ai_chat_messages (conversation_id, created_at);

DO $$
DECLARE u record; conv_id uuid;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM public.ai_chat_messages WHERE conversation_id IS NULL LOOP
    INSERT INTO public.ai_conversations (user_id, title)
      VALUES (u.user_id, 'Historique') RETURNING id INTO conv_id;
    UPDATE public.ai_chat_messages
      SET conversation_id = conv_id
      WHERE u.user_id = ai_chat_messages.user_id AND conversation_id IS NULL;
  END LOOP;
END $$;