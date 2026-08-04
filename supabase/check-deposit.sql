-- =====================================================================
-- USAA-style online banking portal
-- Check deposit: storage bucket, check_deposits table, deposit RPC,
-- plus one-time data fixes (realistic account numbers, synthetic
-- routing number, no seeded credit limits).
-- Run this in the Supabase SQL editor AFTER schema.sql and seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Private storage bucket for check images
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'check-images',
  'check-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "upload own check images" on storage.objects;
create policy "upload own check images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'check-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "read own check images" on storage.objects;
create policy "read own check images" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'check-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "update own check images" on storage.objects;
create policy "update own check images" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'check-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'check-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "delete own check images" on storage.objects;
create policy "delete own check images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'check-images'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

-- ---------------------------------------------------------------------
-- Check deposits ledger
-- ---------------------------------------------------------------------
create table if not exists public.check_deposits (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts (id) on delete cascade not null,
  user_id uuid references auth.users (id) on delete cascade not null,
  transaction_id uuid references public.transactions (id) on delete cascade,
  amount_cents bigint not null,
  front_image text not null,
  back_image text not null,
  status text not null default 'pending' check (status in ('pending','completed','void')),
  created_at timestamptz not null default now()
);

alter table public.check_deposits enable row level security;

drop policy if exists "own check deposits" on public.check_deposits;
create policy "own check deposits" on public.check_deposits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Mobile check deposit (pending transaction + image record, atomically)
-- ---------------------------------------------------------------------
create or replace function public.deposit_check(
  p_account uuid,
  p_amount bigint,
  p_front_image text,
  p_back_image text
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_t uuid;
  v_d uuid;
begin
  if u is null then raise exception 'not authenticated'; end if;
  if p_amount <= 0 then raise exception 'invalid amount'; end if;
  if p_front_image is null or p_back_image is null then
    raise exception 'missing check images';
  end if;

  insert into public.transactions
    (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
  values
    (p_account, u, 'Mobile check deposit', 'Mobile Deposit', 'Income',
     p_amount, 'pending', now(), 'DEP-' || left(gen_random_uuid()::text, 6))
  returning id into v_t;

  insert into public.check_deposits
    (account_id, user_id, transaction_id, amount_cents, front_image, back_image, status)
  values
    (p_account, u, v_t, p_amount, p_front_image, p_back_image, 'pending')
  returning id into v_d;

  return v_d;
end;
$$;

grant execute on function public.deposit_check(uuid, bigint, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- One-time data fixes for existing members
-- ---------------------------------------------------------------------

-- No more seeded credit limits.
update public.accounts set credit_limit_cents = null where type = 'credit_card';

-- Synthetic routing number (replaces the real USAA ABA number).
update public.accounts set routing_number = '107236411';

-- Realistic digit-only account numbers: 10 digits for deposit and
-- investment accounts, 16 digits for credit cards.
update public.accounts set account_number =
  case
    when type in ('checking', 'savings', 'investment') then
      lpad(
        ((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)))::bit(40)::bigint
         % 10000000000)::text,
        10, '0'
      )
    else
      lpad(
        ((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 14)))::bit(56)::bigint
         % 10000000000000000)::text,
        16, '0'
      )
  end;
