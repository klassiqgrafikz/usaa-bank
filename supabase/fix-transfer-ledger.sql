-- =====================================================================
-- Fix transfer ledger: every transfer now deducts from BOTH the total
-- balance and available balance on the sender, credits both on the
-- receiver, stores the external account number, and records a
-- transaction on every account involved.
-- Run this in the Supabase SQL editor.
-- =====================================================================

alter table public.transfers add column if not exists external_account text;

-- ---------------------------------------------------------------------
-- Internal transfer: balance + available on both sides
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

  update public.accounts set balance_cents = balance_cents - p_amount,
         available_cents = available_cents - p_amount
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

-- ---------------------------------------------------------------------
-- External transfer: balance + available on sender, account stored
-- ---------------------------------------------------------------------
create or replace function public.make_external_transfer(
  p_from uuid,
  p_external_name text,
  p_amount bigint,
  p_type text default 'external',
  p_schedule text default 'one_time',
  p_frequency text default null,
  p_next_run timestamptz default null,
  p_note text default null,
  p_external_account text default null
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

  update public.accounts set balance_cents = balance_cents - p_amount,
         available_cents = available_cents - p_amount
   where id = p_from and user_id = u and available_cents - p_amount >= 0;
  if not found then raise exception 'insufficient funds'; end if;

  insert into public.transfers (user_id, from_account_id, external_name, external_account, amount_cents, transfer_type, schedule, frequency, next_run, status, note)
  values (u, p_from, p_external_name, nullif(btrim(coalesce(p_external_account, '')), ''), p_amount, p_type, p_schedule, p_frequency, coalesce(p_next_run, now()), 'completed', p_note)
  returning id into v_t;

  insert into public.transactions (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
  values (p_from, u, case when p_type = 'wire' then 'Wire transfer to ' else 'Transfer to ' end || coalesce(p_external_name, 'External'),
          null, case when p_type = 'wire' then 'Wire Transfer' else 'Transfer' end,
          -p_amount, 'posted', now(), 'TRF-' || left(v_t::text, 6));

  return v_t;
end;
$$;

-- ---------------------------------------------------------------------
-- Bill pay: balance + available on sender
-- ---------------------------------------------------------------------
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

  update public.accounts set balance_cents = balance_cents - p_amount,
         available_cents = available_cents - p_amount
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

-- ---------------------------------------------------------------------
-- Zelle: balance + available on sender
-- ---------------------------------------------------------------------
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
    update public.accounts set balance_cents = balance_cents - p_amount,
           available_cents = available_cents - p_amount
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

grant execute on function public.make_external_transfer(uuid, text, bigint, text, text, text, timestamptz, text, text) to anon, authenticated;
