-- Thorga Kathmandu Samparka Tatha Bikash Manch
-- Supabase SQL Database Schema with Row Level Security (RLS)

-- 1. Executive & Advisory Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ne TEXT NOT NULL,
    role_en TEXT NOT NULL,
    role_ne TEXT NOT NULL,
    committee_type TEXT NOT NULL CHECK (committee_type IN ('current', 'past', 'advisor')),
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
CREATE POLICY "Allow public read on site_settings" ON public.site_settings FOR SELECT USING (true);

-- Public Insert for Inquiries
CREATE POLICY "Allow public insert on inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

-- Authenticated Admin Full Access Policies
CREATE POLICY "Allow admin full access on members" ON public.members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on publications" ON public.publications FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on gallery" ON public.gallery FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on inquiries" ON public.inquiries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin full access on site_settings" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
