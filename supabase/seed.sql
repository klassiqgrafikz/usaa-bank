-- =====================================================================
-- USAA-style online banking portal
-- Functions
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- =====================================================================

-- -------------------------------------------------------------------------
-- Provision a new member's account shells (all at $0 — no sample data)
-- -------------------------------------------------------------------------
create or replace function public.ensure_member_data()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  ch uuid; sv uuid; cc uuid; iv uuid;
  gen text;
  ch_num text; sv_num text; cc_num text; iv_num text;
begin
  if u is null then
    raise exception 'not authenticated';
  end if;

  if exists (select 1 from public.accounts where user_id = u limit 1) then
    return;
  end if;

  -- Realistic digit-only account numbers for this member (10-digit deposit
  -- and investment accounts, 16-digit credit card), derived from the uuid
  -- so every member gets a unique set.
  gen := replace(gen_random_uuid()::text, '-', '');
  ch_num := lpad((('x' || substr(gen, 1, 10))::bit(40)::bigint % 10000000000)::text, 10, '0');
  sv_num := lpad((('x' || substr(gen, 11, 10))::bit(40)::bigint % 10000000000)::text, 10, '0');
  cc_num := lpad((('x' || substr(gen, 1, 14))::bit(56)::bigint % 10000000000000000)::text, 16, '0');
  iv_num := lpad((('x' || substr(gen, 17, 10))::bit(40)::bigint % 10000000000)::text, 10, '0');
  insert into public.accounts
    (user_id, name, type, account_number, routing_number,
     balance_cents, available_cents, credit_limit_cents, apr, apy, opened_at)
  values
    (u, 'Secure Checking', 'checking', ch_num,
     '107236411', 0, 0, null, null, 0.10, current_date),
    (u, 'Performance First Savings', 'savings', sv_num,
     '107236411', 0, 0, null, null, 4.35, current_date),
    (u, 'USAA Rewards Visa Platinum', 'credit_card', cc_num,
     '107236411', 0, 0, null, 24.99, null, current_date),
    (u, 'USAA Retirement Fund', 'investment', iv_num,
     '107236411', 0, 0, null, null, null, current_date);

  select id into ch from public.accounts where user_id = u and type = 'checking';
  select id into sv from public.accounts where user_id = u and type = 'savings';
  select id into cc from public.accounts where user_id = u and type = 'credit_card';
  select id into iv from public.accounts where user_id = u and type = 'investment';

  insert into public.cards (user_id, account_id, card_last4, brand, card_type, status, expires) values
    (u, ch, right(ch_num, 4), 'Visa', 'debit', 'active',
     to_char(current_date + interval '4 years', 'MM/YY')),
    (u, cc, right(cc_num, 4), 'Visa', 'credit', 'active',
     to_char(current_date + interval '4 years', 'MM/YY'));

  insert into public.alert_preferences (user_id) values (u)
    on conflict (user_id) do nothing;

  return;
end;
$$;

-- -------------------------------------------------------------------------
-- Bank operations (atomic transfers, bill pay, zelle)
-- -------------------------------------------------------------------------
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

-- Bill pay (one-time posts immediately; recurring schedules)
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

create or replace function public.set_card_status(p_card uuid, p_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.cards set status = p_status where id = p_card and user_id = auth.uid();
end;
$$;

-- -------------------------------------------------------------------------
-- Cleanup of the previous demo-only plumbing
-- -------------------------------------------------------------------------
drop function if exists public.seed_demo_data();
drop function if exists public.reset_demo_data();
drop function if exists public.create_demo_code(text);
drop function if exists public.verify_demo_code(text, text);
drop table if exists public.login_codes;

-- -------------------------------------------------------------------------
-- Grants
-- -------------------------------------------------------------------------
grant execute on function public.ensure_member_data() to anon, authenticated;
grant execute on function public.make_internal_transfer(uuid, uuid, bigint, text, text, timestamptz, text) to anon, authenticated;
grant execute on function public.make_external_transfer(uuid, text, bigint, text, text, text, timestamptz, text) to anon, authenticated;
grant execute on function public.make_bill_payment(uuid, uuid, bigint, text, text, timestamptz) to anon, authenticated;
grant execute on function public.make_zelle_transfer(uuid, bigint, text, text) to anon, authenticated;
grant execute on function public.set_card_status(uuid, text) to anon, authenticated;
