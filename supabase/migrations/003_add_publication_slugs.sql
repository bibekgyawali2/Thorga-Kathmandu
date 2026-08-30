-- Migration: 003_add_publication_slugs.sql
-- Update page_documents constraint to include new publication slugs

ALTER TABLE public.page_documents DROP CONSTRAINT IF EXISTS page_documents_slug_check;

ALTER TABLE public.page_documents ADD CONSTRAINT page_documents_slug_check CHECK (slug IN (
    'statute', 'life-members', 'certificates',
    'former-officials', 'former-advisors',
    'calendar', 'phone-directory', 'bulletin', 'souvenir',
    'sansthan-prakashan', 'thorga-sambandhi-anya-prakashan',
    'other'
));
