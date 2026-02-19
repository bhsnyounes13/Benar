
-- Add new statuses to contract_status enum
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'submitted';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'needs_revision';
ALTER TYPE public.contract_status ADD VALUE IF NOT EXISTS 'approved';

-- Add revision tracking columns to contracts
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS revision_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
