
-- Add notification preferences to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS push_subscription TEXT,
  ADD COLUMN IF NOT EXISTS notif_session_reminder BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_session_reminder_time TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS notif_streak_motivation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notif_coach_messages BOOLEAN DEFAULT true;

-- Coach notifications table
CREATE TABLE IF NOT EXISTS public.coach_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL,
  student_id UUID NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coach_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage their notifications"
  ON public.coach_notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Students can view notifications sent to them"
  ON public.coach_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);
