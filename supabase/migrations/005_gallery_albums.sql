-- Migration: 005_gallery_albums.sql
-- Create gallery_albums table for photo albums with titles and multiple images with captions

CREATE TABLE IF NOT EXISTS public.gallery_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_ne TEXT NOT NULL,
    description_en TEXT DEFAULT '',
    description_ne TEXT DEFAULT '',
    cover_image_url TEXT DEFAULT '',
    images JSONB NOT NULL DEFAULT '[]'::jsonb,
    date_en TEXT DEFAULT '',
    date_ne TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gallery_albums' AND policyname = 'Allow public read on gallery_albums'
  ) THEN
    CREATE POLICY "Allow public read on gallery_albums" ON public.gallery_albums FOR SELECT USING (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_gallery_albums_created_at ON public.gallery_albums (created_at DESC);
