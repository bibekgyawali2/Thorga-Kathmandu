-- Thorga Kathmandu Samparka Tatha Bikash Manch
-- Supabase SQL Database Schema with Row Level Security (RLS)

-- 1. Executive & Advisory Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ne TEXT NOT NULL,
    role_en TEXT NOT NULL,
    role_ne TEXT NOT NULL,
    committee_type TEXT NOT NULL CHECK (committee_type IN ('current', 'past', 'advisor', 'officials')),
    tenure_en TEXT,
    tenure_ne TEXT,
    phone TEXT,
    email TEXT,
    photo_url TEXT NOT NULL,
    bio_en TEXT,
    bio_ne TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Events & Community Programs Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_ne TEXT NOT NULL,
    date_en TEXT NOT NULL,
    date_ne TEXT NOT NULL,
    time_en TEXT NOT NULL,
    time_ne TEXT NOT NULL,
    location_en TEXT NOT NULL,
    location_ne TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_ne TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('upcoming', 'completed')),
    category_en TEXT NOT NULL,
    category_ne TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Publications & PDF Documents Table
CREATE TABLE IF NOT EXISTS public.publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_ne TEXT NOT NULL,
    category_en TEXT NOT NULL,
    category_ne TEXT NOT NULL,
    published_year_en TEXT NOT NULL,
    published_year_ne TEXT NOT NULL,
    file_size TEXT NOT NULL,
    pages INT DEFAULT 1,
    pdf_url TEXT NOT NULL,
    cover_image_url TEXT,
    description_en TEXT,
    description_ne TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Community Photo Gallery Table
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_ne TEXT NOT NULL,
    category_en TEXT NOT NULL,
    category_ne TEXT NOT NULL,
    image_url TEXT NOT NULL,
    date_en TEXT,
    date_ne TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Contact Inquiries Table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Organizational Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Allow public read on members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public read on events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public read on publications" ON public.publications FOR SELECT USING (true);
CREATE POLICY "Allow public read on gallery" ON public.gallery FOR SELECT USING (true);
-- Only presentation settings are publicly readable. The admin_users roster
-- also lives in this table, and the anon key is public by design, so a
-- blanket USING (true) would publish every administrator record.
CREATE POLICY "Allow public read on presentation settings" ON public.site_settings
  FOR SELECT USING (key IN ('hero', 'branding', 'contact'));

-- Inquiries carry personal contact details and are never publicly readable or
-- writable. Submissions go through /api/inquiries, which validates and rate
-- limits them, then writes with the service role (which bypasses RLS).
--
-- Administrators are authenticated by the application's own signed JWT, not by
-- Supabase Auth, so no "authenticated" role policies are defined: they would
-- never match, and granting them only widens the surface.

-- Indexes for the queries the application issues.
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_members_committee_type ON public.members (committee_type, display_order);
