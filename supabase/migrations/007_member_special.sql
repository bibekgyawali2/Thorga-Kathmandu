-- Migration: 007_member_special.sql
-- Password-protected Member Special section:
-- 1. member_special_users (authorized member accounts with separate login)
-- 2. member_special_records (Abhilekh documents with Google Drive links)
-- 3. member_special_finances (Income and expense financial entries)

-- 1. Member Access Credentials Table
CREATE TABLE IF NOT EXISTS public.member_special_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 2. Member Special Records Table (अभिलेख)
CREATE TABLE IF NOT EXISTS public.member_special_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    drive_url TEXT NOT NULL,
    category TEXT DEFAULT 'साधारण अभिलेख',
    date_bs TEXT DEFAULT '',
    description TEXT DEFAULT '',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Member Special Finances Table (आम्दानी / खर्च)
CREATE TABLE IF NOT EXISTS public.member_special_finances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
    fiscal_year TEXT DEFAULT '',
    date_bs TEXT DEFAULT '',
    category TEXT DEFAULT 'विविध',
    document_url TEXT DEFAULT '',
    remarks TEXT DEFAULT '',
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
-- Crucial: These tables contain confidential member records and internal finances.
-- Public anonymous reads are NOT granted. All operations are mediated by the server
-- with service role / direct database connection after verifying JWT authentication.
ALTER TABLE public.member_special_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_special_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_special_finances ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_member_special_users_username ON public.member_special_users (username);
CREATE INDEX IF NOT EXISTS idx_member_special_records_order ON public.member_special_records (display_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_member_special_finances_fiscal ON public.member_special_finances (fiscal_year, date_bs DESC);
CREATE INDEX IF NOT EXISTS idx_member_special_finances_type ON public.member_special_finances (type);
