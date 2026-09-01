-- Migration: 004_add_officials_committee_type.sql
-- Allow 'officials' (Current Executive Committee / वर्तमान कार्यसमिति) in members committee_type check constraint while preserving all existing data

ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_committee_type_check;

ALTER TABLE public.members ADD CONSTRAINT members_committee_type_check CHECK (
    committee_type IN ('current', 'past', 'advisor', 'officials')
);
