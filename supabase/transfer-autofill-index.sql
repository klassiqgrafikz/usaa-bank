-- =====================================================================
-- Speed up member-autofill: index the account number lookup.
-- Run this in the Supabase SQL editor.
-- =====================================================================

create index if not exists idx_accounts_account_number on public.accounts (account_number);