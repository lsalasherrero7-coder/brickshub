-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  surface_area NUMERIC,
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  floor TEXT,
  property_type TEXT NOT NULL DEFAULT 'piso',
  listing_price NUMERIC DEFAULT 0,
  min_price NUMERIC DEFAULT 0,
  commission_pct NUMERIC DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'disponible',
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  owner_dni TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_photos table
CREATE TABLE public.property_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create property_documents table
CREATE TABLE public.property_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  custom_name TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- Public access policies for internal CRM
CREATE POLICY "Allow all access to properties" ON public.properties FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to property_photos" ON public.property_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to property_documents" ON public.property_documents FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('property-documents', 'property-documents', true);

-- Storage policies
CREATE POLICY "Public read property photos" ON storage.objects FOR SELECT USING (bucket_id = 'property-photos');
CREATE POLICY "Allow upload property photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-photos');
CREATE POLICY "Allow delete property photos" ON storage.objects FOR DELETE USING (bucket_id = 'property-photos');

CREATE POLICY "Public read property documents" ON storage.objects FOR SELECT USING (bucket_id = 'property-documents');
CREATE POLICY "Allow upload property documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-documents');
CREATE POLICY "Allow delete property documents" ON storage.objects FOR DELETE USING (bucket_id = 'property-documents');