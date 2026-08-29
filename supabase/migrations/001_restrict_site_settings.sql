-- ---------------------------------------------------------------------------
-- Security fix: stop exposing administrator records through the public API.
--
-- site_settings previously carried "FOR SELECT USING (true)", and the
-- admin_users roster is stored in that table. Because the Supabase anon key is
-- published in the browser bundle by design, anyone could read every
-- administrator record straight from the REST API:
--
--   GET /rest/v1/site_settings?key=eq.admin_users
--
-- Run this against every existing database. New installs get it from
-- schema.sql.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow public read on site_settings" ON public.site_settings;

-- Only the keys that public pages actually render are readable anonymously.
-- admin_users, and anything added later, stays private by default.
DROP POLICY IF EXISTS "Allow public read on presentation settings" ON public.site_settings;
CREATE POLICY "Allow public read on presentation settings"
  ON public.site_settings
  FOR SELECT
  USING (key IN ('hero', 'branding', 'contact'));

-- Inquiries hold personal contact details of members of the public. Writes
-- arrive through the server API using the service role, which bypasses RLS, so
-- no anonymous policy is needed here at all.
DROP POLICY IF EXISTS "Allow public insert on inquiries" ON public.inquiries;

-- The application authenticates administrators with its own signed JWT rather
-- than Supabase Auth, so the "authenticated" role never matches and these
-- policies only widened the surface. Server writes use the service role.
DROP POLICY IF EXISTS "Allow admin full access on members" ON public.members;
DROP POLICY IF EXISTS "Allow admin full access on events" ON public.events;
DROP POLICY IF EXISTS "Allow admin full access on publications" ON public.publications;
DROP POLICY IF EXISTS "Allow admin full access on gallery" ON public.gallery;
DROP POLICY IF EXISTS "Allow admin full access on inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Allow admin full access on site_settings" ON public.site_settings;

-- Useful indexes for the queries the app actually issues.
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events (status);
CREATE INDEX IF NOT EXISTS idx_members_committee_type ON public.members (committee_type, display_order);
