
-- Campaigns table (editable list)
CREATE TABLE public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to marketing_campaigns" ON public.marketing_campaigns FOR ALL USING (true) WITH CHECK (true);

-- Insert default campaigns
INSERT INTO public.marketing_campaigns (name) VALUES ('Herencias'), ('Valor de tu casa'), ('Genérica');

-- Marketing leads table
CREATE TABLE public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  campaign_id uuid NOT NULL REFERENCES public.marketing_campaigns(id),
  status text NOT NULL DEFAULT 'nuevo',
  assigned_agent_id uuid,
  next_action_type text,
  next_action_date timestamptz,
  next_action_note text,
  contact_id uuid REFERENCES public.contacts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to marketing_leads" ON public.marketing_leads FOR ALL USING (true) WITH CHECK (true);

-- Interactions history (append-only log)
CREATE TABLE public.marketing_lead_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.marketing_leads(id) ON DELETE CASCADE,
  interaction_type text NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketing_lead_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to marketing_lead_interactions" ON public.marketing_lead_interactions FOR ALL USING (true) WITH CHECK (true);
