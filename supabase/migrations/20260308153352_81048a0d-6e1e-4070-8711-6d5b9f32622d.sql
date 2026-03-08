
CREATE TABLE public.recommendation_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  category text NOT NULL,
  title_fr text NOT NULL,
  title_en text NOT NULL,
  content_fr text NOT NULL,
  content_en text NOT NULL,
  trigger_type text,
  trigger_config jsonb,
  duration_minutes integer,
  sort_order smallint NOT NULL DEFAULT 0
);

ALTER TABLE public.recommendation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read templates" ON public.recommendation_templates FOR SELECT USING (true);
