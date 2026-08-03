-- =====================================================================
-- USAA-style online banking demo
-- Schema + Row Level Security
-- Run this in the Supabase SQL editor (all of it).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  address_line1 text,
  city text,
  state text,
  zip text,
  date_of_birth date,
  ssn_last4 text,
  military_branch text,
  member_since timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('checking','savings','credit_card','loan','investment')),
  account_number text not null,
  routing_number text not null,
  balance_cents bigint not null default 0,
  available_cents bigint not null default 0,
  credit_limit_cents bigint,
  apr numeric(6,3),
  apy numeric(6,3),
  status text not null default 'active' check (status in ('active','closed')),
  opened_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts (id) on delete cascade not null,
  user_id uuid references auth.users (id) on delete cascade not null,
  description text not null,
  merchant text,
  category text not null default 'Other',
  amount_cents bigint not null,
  status text not null default 'posted' check (status in ('posted','pending')),
  posted_at timestamptz not null default now(),
  reference text
);
create index if not exists idx_transactions_user on public.transactions (user_id, posted_at desc);
create index if not exists idx_transactions_account on public.transactions (account_id);

-- ---------------------------------------------------------------------
-- Transfers
-- ---------------------------------------------------------------------
create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  from_account_id uuid references public.accounts (id) on delete set null,
  to_account_id uuid references public.accounts (id) on delete set null,
  external_name text,
  amount_cents bigint not null,
  transfer_type text not null default 'internal'
    check (transfer_type in ('internal','external','wire','zelle')),
  schedule text not null default 'one_time' check (schedule in ('one_time','recurring')),
  frequency text,
  next_run timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled','completed','failed')),
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Payees + Bill payments
-- ---------------------------------------------------------------------
create table if not exists public.payees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  name text not null,
  category text not null default 'Other',
  account_last4 text,
  routing_last4 text,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.bill_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  payee_id uuid references public.payees (id) on delete cascade not null,
  from_account_id uuid references public.accounts (id) on delete set null,
  amount_cents bigint not null,
  schedule text not null default 'one_time' check (schedule in ('one_time','recurring')),
  frequency text,
  next_run timestamptz,
  status text not null default 'scheduled'
    check (status in ('scheduled','completed','failed','cancelled')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Zelle
-- ---------------------------------------------------------------------
create table if not exists public.zelle_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  name text not null,
  email_or_phone text not null,
  bank text,
  created_at timestamptz not null default now()
);

create table if not exists public.zelle_transfers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  direction text not null check (direction in ('sent','received')),
  contact_id uuid references public.zelle_contacts (id) on delete set null,
  amount_cents bigint not null,
  status text not null default 'completed' check (status in ('pending','completed','failed')),
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Cards
-- ---------------------------------------------------------------------
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  account_id uuid references public.accounts (id) on delete cascade not null,
  card_last4 text not null,
  brand text not null default 'Visa',
  card_type text not null check (card_type in ('debit','credit')),
  status text not null default 'active' check (status in ('active','locked','lost','stolen')),
  expires text not null
);

-- ---------------------------------------------------------------------
-- Investment holdings
-- ---------------------------------------------------------------------
create table if not exists public.investment_holdings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts (id) on delete cascade not null,
  user_id uuid references auth.users (id) on delete cascade not null,
  symbol text not null,
  name text not null,
  shares numeric(14,4) not null default 0,
  avg_cost_cents bigint not null default 0,
  current_price_cents bigint not null default 0
);

-- ---------------------------------------------------------------------
-- Alerts
-- ---------------------------------------------------------------------
create table if not exists public.alert_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade not null,
  low_balance boolean not null default true,
  large_transaction boolean not null default true,
  login_activity boolean not null default true,
  bill_due boolean not null default true,
  credit_report boolean not null default false,
  email_me boolean not null default false,
  push_me boolean not null default true
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  title text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('info','warning','success','critical')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Disputes
-- ---------------------------------------------------------------------
create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  transaction_ref text not null,
  amount_cents bigint not null,
  reason text not null,
  status text not null default 'submitted' check (status in ('submitted','in_review','resolved')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Login codes (demo second step / password reset)
-- ---------------------------------------------------------------------
create table if not exists public.login_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  code text not null,
  purpose text not null default '2fa' check (purpose in ('2fa','password_reset')),
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.transfers enable row level security;
alter table public.payees enable row level security;
alter table public.bill_payments enable row level security;
alter table public.zelle_contacts enable row level security;
alter table public.zelle_transfers enable row level security;
alter table public.cards enable row level security;
alter table public.investment_holdings enable row level security;
alter table public.alert_preferences enable row level security;
alter table public.alerts enable row level security;
alter table public.disputes enable row level security;
alter table public.login_codes enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own accounts" on public.accounts;
create policy "own accounts" on public.accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own transfers" on public.transfers;
create policy "own transfers" on public.transfers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own payees" on public.payees;
create policy "own payees" on public.payees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own bill payments" on public.bill_payments;
create policy "own bill payments" on public.bill_payments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own zelle contacts" on public.zelle_contacts;
create policy "own zelle contacts" on public.zelle_contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own zelle transfers" on public.zelle_transfers;
create policy "own zelle transfers" on public.zelle_transfers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own cards" on public.cards;
create policy "own cards" on public.cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own holdings" on public.investment_holdings;
create policy "own holdings" on public.investment_holdings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own alert preferences" on public.alert_preferences;
create policy "own alert preferences" on public.alert_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own alerts" on public.alerts;
create policy "own alerts" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own disputes" on public.disputes;
create policy "own disputes" on public.disputes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- login_codes: users can only manage their own demo codes
drop policy if exists "own login codes" on public.login_codes;
create policy "own login codes" on public.login_codes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);