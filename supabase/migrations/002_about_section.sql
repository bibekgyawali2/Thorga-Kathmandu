-- ---------------------------------------------------------------------------
-- "About Us" section: nine sub-pages, all editable from the admin panel.
--
-- Three shapes cover all nine:
--   content_pages   free text pages (Organisation Profile, About Thorga)
--   page_documents  an attached PDF or image. Used by the About Us document
--                   pages (Statute, Life Members, Registration Certificates)
--                   the former-committee pages (one file per term, so a 2023
--                   group photograph and a 2024 one sit side by side), and the
--                   single-file Publications pages
--
-- Current Executive Committee and Current Advisors read from the existing
-- members table and need no new storage.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_pages (
    slug TEXT PRIMARY KEY,
    title_en TEXT NOT NULL,
    title_ne TEXT NOT NULL,
    body_en TEXT,
    body_ne TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.page_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Which page the document appears on. Covers both the About Us document
    -- pages and the single-file pages under Publications.
    slug TEXT NOT NULL CHECK (slug IN (
        'statute', 'life-members', 'certificates',
        'former-officials', 'former-advisors',
        'calendar', 'phone-directory', 'bulletin', 'souvenir', 'other'
    )),
    title_en TEXT NOT NULL,
    title_ne TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image')),
    -- Page count for PDFs, used by the in-page viewer. Null when unknown.
    page_count INT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_documents ENABLE ROW LEVEL SECURITY;

-- Public pages, so anonymous read is correct here. Writes go through the
-- authenticated API using the service role, which bypasses RLS.
CREATE POLICY "Allow public read on content_pages" ON public.content_pages FOR SELECT USING (true);
CREATE POLICY "Allow public read on page_documents" ON public.page_documents FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_page_documents_slug ON public.page_documents (slug, display_order);
