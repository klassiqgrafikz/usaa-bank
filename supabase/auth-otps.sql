-- One-time codes for the Resend-powered two-step verification.
-- Only the service role can read/write: RLS is on with no policies.
-- Run this in the Supabase SQL editor.

create table if not exists public.auth_otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.auth_otps enable row level security;

create index if not exists auth_otps_email_created_idx
  on public.auth_otps (email, created_at desc);
