
-- Support tickets table
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  screenshot_urls text[],
  device_info text,
  app_page text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate ticket number
CREATE SEQUENCE public.ticket_number_seq START 1;
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := 'TK-' || LPAD(nextval('public.ticket_number_seq')::text, 3, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_ticket_number BEFORE INSERT ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();

-- Updated_at trigger for support_tickets
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tickets" ON public.support_tickets FOR ALL
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL
  TO authenticated USING (public.is_admin(auth.uid()));

-- Ticket messages table
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  attachment_urls text[],
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ticket messages" ON public.ticket_messages FOR SELECT
  TO authenticated USING (
    is_internal = false AND EXISTS (
      SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own ticket messages" ON public.ticket_messages FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = sender_id AND is_internal = false AND EXISTS (
      SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND st.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all messages" ON public.ticket_messages FOR ALL
  TO authenticated USING (public.is_admin(auth.uid()));

-- KB articles table
CREATE TABLE public.kb_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_fr text NOT NULL,
  title_en text NOT NULL,
  content_fr text NOT NULL,
  content_en text NOT NULL,
  category text NOT NULL,
  tags text[],
  role_target text NOT NULL DEFAULT 'both',
  is_published boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_kb_articles_updated_at BEFORE UPDATE ON public.kb_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read published articles" ON public.kb_articles FOR SELECT
  TO authenticated USING (is_published = true);

CREATE POLICY "Admins can manage all articles" ON public.kb_articles FOR ALL
  TO authenticated USING (public.is_admin(auth.uid()));

-- Storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', false);

CREATE POLICY "Users can upload support attachments" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own support attachments" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'support-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all support attachments" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'support-attachments' AND public.is_admin(auth.uid()));

-- Enable realtime for ticket messages and support tickets
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
