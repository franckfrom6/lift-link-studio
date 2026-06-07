-- Remove plaintext Strava OAuth token columns; only encrypted variants remain.
-- Any remaining plaintext-only rows lose access and must reconnect via OAuth.
ALTER TABLE public.strava_connections DROP COLUMN IF EXISTS access_token;
ALTER TABLE public.strava_connections DROP COLUMN IF EXISTS refresh_token;
