-- Migration: 006_business_showcase.sql
-- Create businesses table for community business and profession showcase

CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT '',
    file_type TEXT NOT NULL DEFAULT 'image' CHECK (file_type IN ('image', 'pdf')),
    file_url TEXT NOT NULL,
    contact_phone TEXT DEFAULT '',
    contact_email TEXT DEFAULT '',
    contact_address TEXT DEFAULT '',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'businesses' AND policyname = 'Allow public read on businesses'
  ) THEN
    CREATE POLICY "Allow public read on businesses" ON public.businesses FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_order ON public.businesses (display_order ASC);
