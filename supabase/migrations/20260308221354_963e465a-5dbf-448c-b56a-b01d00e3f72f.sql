
CREATE TABLE public.google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to google_calendar_tokens" ON public.google_calendar_tokens FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.google_calendar_event_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  google_event_id text NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

ALTER TABLE public.google_calendar_event_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to google_calendar_event_map" ON public.google_calendar_event_map FOR ALL USING (true) WITH CHECK (true);
