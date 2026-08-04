-- =====================================================================
-- USAA-style online banking portal
-- Admin portal
--   1. is_admin flag on profiles
--   2. Account restriction (reason + until date) and activity blocking
--   3. app_settings: website maintenance mode + tawk.to live chat
--   4. Admin RPCs (all verify is_admin)
-- Run this in the Supabase SQL editor AFTER schema.sql, seed.sql,
-- check-deposit.sql, virtual-cards.sql and activity-and-avatars.sql.
--
-- AFTER running, promote yourself (or another member) to admin:
--   update public.profiles
--   set is_admin = true
--   where user_id = (select id from auth.users where email = 'YOUR_EMAIL');
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Admin flag
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- ---------------------------------------------------------------------
-- 2. Account restrictions
-- ---------------------------------------------------------------------
alter table public.accounts add column if not exists restricted boolean not null default false;
alter table public.accounts add column if not exists restriction_reason text;
alter table public.accounts add column if not exists restriction_until date;

-- ---------------------------------------------------------------------
-- 3. App settings (single row, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  id smallint primary key default 1 check (id = 1),
  maintenance_mode boolean not null default false,
  tawk_enabled boolean not null default false,
  tawk_property_id text,
  tawk_widget_id text,
  tawk_full_link text,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "read app settings" on public.app_settings;
create policy "read app settings" on public.app_settings
  for select using (true);

-- ---------------------------------------------------------------------
-- 4. Admin helpers
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where user_id = auth.uid() and is_admin
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Admin: add funds by account number
-- ---------------------------------------------------------------------
create or replace function public.admin_add_funds(
  p_account_number text,
  p_amount_cents bigint,
  p_note text default null
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_acct uuid;
  v_name text;
  v_user uuid;
  v_balance bigint;
begin
  if u is null or not public.is_admin() then raise exception 'admin access required'; end if;
  if p_amount_cents is null or p_amount_cents <= 0 then raise exception 'amount must be positive'; end if;

  select id, name, user_id, balance_cents
    into v_acct, v_name, v_user, v_balance
    from public.accounts
   where account_number = btrim(coalesce(p_account_number, ''));
  if not found then raise exception 'account not found'; end if;

  update public.accounts
     set balance_cents = balance_cents + p_amount_cents,
         available_cents = available_cents + p_amount_cents
   where id = v_acct;

  insert into public.transactions
    (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
  values
    (v_acct, v_user, 'Funds added by support', coalesce(nullif(btrim(p_note), ''), 'Admin credit'),
     'Income', p_amount_cents, 'posted', now(), 'ADM-' || left(gen_random_uuid()::text, 6));

  return jsonb_build_object(
    'account_id', v_acct,
    'name', v_name,
    'balance_cents', v_balance + p_amount_cents
  );
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Admin: account restrictions
-- ---------------------------------------------------------------------
create or replace function public.admin_restrict_account(
  p_account_number text,
  p_reason text,
  p_until date
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
begin
  if u is null or not public.is_admin() then raise exception 'admin access required'; end if;
  if p_reason is null or btrim(p_reason) = '' then raise exception 'reason is required'; end if;

  update public.accounts
     set restricted = true,
         restriction_reason = btrim(p_reason),
         restriction_until = p_until
   where account_number = btrim(coalesce(p_account_number, ''));
  if not found then raise exception 'account not found'; end if;

  return jsonb_build_object('restricted', true, 'restriction_until', p_until);
end;
$$;

create or replace function public.admin_unrestrict_account(p_account_number text)
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
begin
  if u is null or not public.is_admin() then raise exception 'admin access required'; end if;

  update public.accounts
     set restricted = false,
         restriction_reason = null,
         restriction_until = null
   where account_number = btrim(coalesce(p_account_number, ''));
  if not found then raise exception 'account not found'; end if;

  return jsonb_build_object('restricted', false);
end;
$$;

create or replace function public.admin_list_restrictions()
returns setof public.accounts
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin access required'; end if;
  return query
    select * from public.accounts
     where restricted
     order by restriction_until nulls last, account_number;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. Admin: stats + settings
-- ---------------------------------------------------------------------
create or replace function public.admin_stats()
returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_total int;
  v_restricted int;
  v_settings app_settings%rowtype;
begin
  if u is null or not public.is_admin() then raise exception 'admin access required'; end if;

  select count(*) into v_total from public.accounts;
  select count(*) into v_restricted from public.accounts where restricted;
  select * into v_settings from public.app_settings where id = 1;

  return jsonb_build_object(
    'total_accounts', v_total,
    'restricted_count', v_restricted,
    'maintenance_mode', v_settings.maintenance_mode,
    'tawk_enabled', v_settings.tawk_enabled
  );
end;
$$;

create or replace function public.admin_update_settings(
  p_maintenance_mode boolean default null,
  p_tawk_enabled boolean default null,
  p_tawk_property_id text default null,
  p_tawk_widget_id text default null,
  p_tawk_full_link text default null
) returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin access required'; end if;

  update public.app_settings
     set maintenance_mode = coalesce(p_maintenance_mode, maintenance_mode),
         tawk_enabled = coalesce(p_tawk_enabled, tawk_enabled),
         tawk_property_id = nullif(coalesce(p_tawk_property_id, tawk_property_id), ''),
         tawk_widget_id = nullif(coalesce(p_tawk_widget_id, tawk_widget_id), ''),
         tawk_full_link = nullif(coalesce(p_tawk_full_link, tawk_full_link), ''),
         updated_at = now()
   where id = 1;
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Block money movement from restricted accounts
-- ---------------------------------------------------------------------
create or replace function public.make_internal_transfer(
  p_from uuid,
  p_to uuid,
  p_amount bigint,
  p_schedule text default 'one_time',
  p_frequency text default null,
  p_next_run timestamptz default null,
  p_note text default null
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_t uuid;
  from_name text;
  to_name text;
begin
  if u is null then raise exception 'not authenticated'; end if;
  if p_amount <= 0 then raise exception 'invalid amount'; end if;

  if exists (select 1 from public.accounts where id = p_from and restricted) then
    raise exception 'This account is restricted and cannot send money';
  end if;

  update public.accounts set available_cents = available_cents - p_amount
   where id = p_from and user_id = u and available_cents >= p_amount
     and type in ('checking','savings');
  if not found then raise exception 'insufficient funds'; end if;

  update public.accounts set balance_cents = balance_cents + p_amount,
         available_cents = available_cents + p_amount
   where id = p_to and user_id = u;
  if not found then raise exception 'invalid destination account'; end if;

  select name into to_name from public.accounts where id = p_to;
  select name into from_name from public.accounts where id = p_from;

  insert into public.transfers
    (user_id, from_account_id, to_account_id, amount_cents, transfer_type, schedule, frequency, next_run, status, note)
  values
    (u, p_from, p_to, p_amount, 'internal', p_schedule, p_frequency, p_next_run, 'completed', p_note)
  returning id into v_t;

  insert into public.transactions (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
  values
    (p_from, u, 'Transfer to ' || to_name, to_name, 'Transfer', -p_amount, 'posted', now(), 'TRF-' || left(v_t::text, 6)),
    (p_to, u, 'Transfer from ' || from_name, from_name, 'Transfer', p_amount, 'posted', now(), 'TRF-' || left(v_t::text, 6));

  return v_t;
end;
$$;

create or replace function public.make_external_transfer(
  p_from uuid,
  p_external_name text,
  p_amount bigint,
  p_type text default 'external',
  p_schedule text default 'one_time',
  p_frequency text default null,
  p_next_run timestamptz default null,
  p_note text default null
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_t uuid;
begin
  if u is null then raise exception 'not authenticated'; end if;
  if p_amount <= 0 then raise exception 'invalid amount'; end if;

  if exists (select 1 from public.accounts where id = p_from and restricted) then
    raise exception 'This account is restricted and cannot send money';
  end if;

  update public.accounts set available_cents = available_cents - p_amount
   where id = p_from and user_id = u and available_cents - p_amount >= 0;
  if not found then raise exception 'insufficient funds'; end if;

  insert into public.transfers (user_id, from_account_id, external_name, amount_cents, transfer_type, schedule, frequency, next_run, status, note)
  values (u, p_from, p_external_name, p_amount, p_type, p_schedule, p_frequency, coalesce(p_next_run, now()), 'completed', p_note)
  returning id into v_t;

  insert into public.transactions (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
  values (p_from, u, case when p_type = 'wire' then 'Wire transfer to ' else 'Transfer to ' end || coalesce(p_external_name, 'External'),
          null, case when p_type = 'wire' then 'Wire Transfer' else 'Transfer' end,
          -p_amount, 'posted', now(), 'TRF-' || left(v_t::text, 6));

  return v_t;
end;
$$;

create or replace function public.make_bill_payment(
  p_payee uuid,
  p_from uuid,
  p_amount bigint,
  p_schedule text default 'one_time',
  p_frequency text default null,
  p_next_run timestamptz default null
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_b uuid;
  v_name text;
begin
  if u is null then raise exception 'not authenticated'; end if;
  select name into v_name from public.payees where id = p_payee and user_id = u;
  if not found then raise exception 'payee not found'; end if;
  if p_amount <= 0 then raise exception 'invalid amount'; end if;

  if exists (select 1 from public.accounts where id = p_from and restricted) then
    raise exception 'This account is restricted and cannot send money';
  end if;

  -- recurring scheduled payments do not touch the balance until delivery
  if p_schedule = 'recurring' then
    insert into public.bill_payments
      (user_id, payee_id, from_account_id, amount_cents, schedule, frequency, next_run, status)
    values
      (u, p_payee, p_from, p_amount, 'recurring', p_frequency, coalesce(p_next_run, now() + interval '1 month'), 'scheduled')
    returning id into v_b;
    return v_b;
  end if;

  update public.accounts set available_cents = available_cents - p_amount
   where id = p_from and user_id = u and available_cents - p_amount >= 0;
  if not found then raise exception 'insufficient funds'; end if;

  insert into public.bill_payments
    (user_id, payee_id, from_account_id, amount_cents, schedule, status)
  values
    (u, p_payee, p_from, p_amount, 'one_time', 'completed')
  returning id into v_b;

  insert into public.transactions (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
  values (p_from, u, 'Bill payment to ' || v_name, v_name, 'Bill Pay', -p_amount, 'posted', now(), 'BPAY-' || left(v_b::text, 6));

  return v_b;
end;
$$;

create or replace function public.make_zelle_transfer(
  p_contact uuid,
  p_amount bigint,
  p_direction text default 'sent',
  p_note text default null
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_t uuid;
  v_check uuid;
  c_name text;
begin
  if u is null then raise exception 'not authenticated'; end if;
  select name into c_name from public.zelle_contacts where id = p_contact and user_id = u;
  if not found then raise exception 'contact not found'; end if;

  select id into v_check from public.accounts where user_id = u and type = 'checking' order by opened_at desc limit 1;

  if p_direction = 'sent' then
    if exists (select 1 from public.accounts where id = v_check and restricted) then
      raise exception 'This account is restricted and cannot send money';
    end if;
    update public.accounts set available_cents = available_cents - p_amount
     where id = v_check and user_id = u and available_cents - p_amount >= 0;
    if not found then raise exception 'insufficient funds'; end if;
  end if;

  insert into public.zelle_transfers (user_id, direction, contact_id, amount_cents, status, note, created_at)
  values (u, p_direction, p_contact, p_amount, 'completed', coalesce(p_note, c_name), now())
  returning id into v_t;

  if p_direction = 'sent' then
    insert into public.transactions (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
    values (v_check, u, 'Zelle payment to ' || c_name, c_name, 'Zelle', -p_amount, 'posted', now(), 'ZELLE-' || left(v_t::text, 6));
  end if;

  return v_t;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Grants
-- ---------------------------------------------------------------------
grant execute on function public.admin_add_funds(text, bigint, text) to authenticated;
grant execute on function public.admin_restrict_account(text, text, date) to authenticated;
grant execute on function public.admin_unrestrict_account(text) to authenticated;
grant execute on function public.admin_list_restrictions() to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_update_settings(boolean, boolean, text, text, text) to authenticated;

grant execute on function public.make_internal_transfer(uuid, uuid, bigint, text, text, timestamptz, text) to anon, authenticated;
grant execute on function public.make_external_transfer(uuid, text, bigint, text, text, text, timestamptz, text) to anon, authenticated;
grant execute on function public.make_bill_payment(uuid, uuid, bigint, text, text, timestamptz) to anon, authenticated;
grant execute on function public.make_zelle_transfer(uuid, bigint, text, text) to anon, authenticated;
