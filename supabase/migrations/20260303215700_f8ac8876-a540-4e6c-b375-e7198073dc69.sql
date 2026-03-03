
-- Leads table (Captación) - designed for future API import from Idealista/Fotocasa
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  listing_url TEXT,
  advertiser_type TEXT NOT NULL DEFAULT 'propietario',
  name TEXT,
  phone TEXT,
  lead_status TEXT NOT NULL DEFAULT 'no_contactado',
  external_portal_id TEXT,
  source_portal TEXT NOT NULL DEFAULT 'manual',
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  lead_status TEXT NOT NULL DEFAULT 'no_contactado',
  source_portal TEXT NOT NULL DEFAULT 'manual',
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact notes
CREATE TABLE public.contact_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contact tasks (linked to calendar)
CREATE TABLE public.contact_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tasks ENABLE ROW LEVEL SECURITY;

-- Open policies (no auth yet, matching existing pattern)
CREATE POLICY "Allow all access to leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to contacts" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to contact_notes" ON public.contact_notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to contact_tasks" ON public.contact_tasks FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_leads_status ON public.leads(lead_status);
CREATE INDEX idx_leads_source ON public.leads(source_portal);
CREATE INDEX idx_leads_external_id ON public.leads(external_portal_id, source_portal);
CREATE INDEX idx_contacts_lead_id ON public.contacts(lead_id);
CREATE INDEX idx_contact_tasks_due_date ON public.contact_tasks(due_date);
CREATE INDEX idx_contact_tasks_contact_id ON public.contact_tasks(contact_id);

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_notes_updated_at BEFORE UPDATE ON public.contact_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contact_tasks_updated_at BEFORE UPDATE ON public.contact_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
