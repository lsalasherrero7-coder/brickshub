
-- Add new columns to contacts
ALTER TABLE contacts ADD COLUMN contact_type text NOT NULL DEFAULT 'vendedor';
ALTER TABLE contacts ADD COLUMN email text;
ALTER TABLE contacts ADD COLUMN last_name text;

-- Create buyer_profiles table
CREATE TABLE buyer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  property_type text,
  bedrooms_min integer,
  bathrooms_min integer,
  budget_min numeric,
  budget_max numeric,
  garage text DEFAULT 'indiferente',
  preferred_floor text DEFAULT 'indiferente',
  preferred_zones text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(contact_id)
);

ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to buyer_profiles" ON buyer_profiles FOR ALL USING (true) WITH CHECK (true);

-- Add zone to properties for matching
ALTER TABLE properties ADD COLUMN zone text;
