
-- Add next action fields to contacts table
ALTER TABLE public.contacts ADD COLUMN next_action_type text NULL;
ALTER TABLE public.contacts ADD COLUMN next_action_date timestamp with time zone NULL;
ALTER TABLE public.contacts ADD COLUMN next_action_note text NULL;

-- Create contact_interactions table
CREATE TABLE public.contact_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to contact_interactions" ON public.contact_interactions FOR ALL USING (true) WITH CHECK (true);
