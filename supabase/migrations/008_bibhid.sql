-- Migration: 008_bibhid.sql
-- Create bibhid table for miscellaneous documents and PDFs via Google Drive links

CREATE TABLE IF NOT EXISTS public.bibhid (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_ne TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    description_en TEXT DEFAULT '',
    description_ne TEXT DEFAULT '',
    category_en TEXT DEFAULT '',
    category_ne TEXT DEFAULT '',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.bibhid ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bibhid' AND policyname = 'Allow public read on bibhid'
  ) THEN
    CREATE POLICY "Allow public read on bibhid" ON public.bibhid FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bibhid_order ON public.bibhid (display_order ASC, created_at DESC);
