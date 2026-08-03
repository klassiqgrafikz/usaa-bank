-- =====================================================================
-- USAA-style online banking demo
-- Functions & demo seed
-- Run this in the Supabase SQL editor AFTER schema.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Demo second-step codes (2FA / password reset)
-- ---------------------------------------------------------------------
create or replace function public.create_demo_code(p_purpose text default '2fa')
returns text
language plpgsql
security definer set search_path = public
as $$
declare v_code text;
begin
  v_code := lpad(floor(random() * 1000000)::text, 6, '0');
  insert into public.login_codes (user_id, code, purpose, expires_at)
  values (auth.uid(), v_code, p_purpose, now() + interval '15 minutes');
  return v_code;
end;
$$;

create or replace function public.verify_demo_code(p_code text, p_purpose text default '2fa')
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare v_ok boolean;
begin
  update public.login_codes
     set used = true
   where user_id = auth.uid()
     and code = p_code
     and purpose = p_purpose
     and used = false
     and expires_at > now()
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- -------------------------------------------------------------------------
-- Seed demo accounts, cards, transactions & co.
-- -------------------------------------------------------------------------
create or replace function public.seed_demo_data()
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  ch uuid; sv uuid; cc uuid; ln uuid; iv uuid;
begin
  if u is null then
    raise exception 'not authenticated';
  end if;

  insert into public.accounts
    (user_id, name, type, account_number, routing_number,
     balance_cents, available_cents, credit_limit_cents, apr, apy, opened_at)
  values
    (u, 'Secure Checking', 'checking', '4582 1902 7710 3361', '314074269',
     845805, 845805, null, null, 0.10, current_date - interval '3 years'),
    (u, 'Performance First Savings', 'savings', '4582 7711 0022 9084', '314074269',
     2483000, 2483000, null, null, 4.35, current_date - interval '6 years'),
    (u, 'USAA Rewards Visa Platinum', 'credit_card', '4797 8813 2244 9056', '314074269',
     214033, 285967, 500000, 24.99, null, current_date - interval '10 years'),
    (u, 'Auto Loan', 'loan', '4582 5511 7022 1044', '314074269',
     1245000, null, null, 6.24, null, current_date - interval '2 years'),
    (u, 'USAA Retirement Fund', 'investment', '4582 1132 8902 4455', '314074269',
     6728000, null, null, null, null, current_date - interval '8 years');

  select id into ch from public.accounts where user_id = u and type = 'checking';
  select id into sp from public.accounts where user_id = u and type = 'savings';
  select id into cc from public.accounts where user_id = u and type = 'credit_card';
  select id into ln from public.accounts where user_id = u and type = 'loan';
  select id into iv from public.accounts where user_id = u and type = 'investment';

  insert into public.payees (user_id, name, category, account_last4, routing_last4, phone, address) values
    (u, 'City Power & Electric', 'Utilities', '8812', '0283', '800-555-0142', 'PO Box 5123, San Antonio, TX'),
    (u, 'Verizon Wireless', 'Telephone', '3310', '1840', '800-555-0177', 'PO Box 9000, Dallas, TX'),
    (u, 'Sunstate Insurance Co.', 'Insurance', '7745', '3290', '800-555-0104', '1400 Market St, San Francisco, CA'),
    (u, 'Homeowners Association', 'Housing', '2021', '5510', '800-555-0128', '500 Oak Creek Rd, Austin, TX');

  insert into public.bill_payments (user_id, payee_id, from_account_id, amount_cents, schedule, frequency, next_run, status) values
    (u, (select id from public.payees where user_id = u and name = 'Verizon Wireless'), ch, 8900, 'recurring', 'monthly', current_date + interval '8 days', 'scheduled'),
    (u, (select id from public.payees where user_id = u and name = 'City Power & Electric'), ch, 13450, 'one_time', null, null, 'completed'),
    (u, (select id from public.payees where user_id = u and name = 'Sunstate Insurance Co.'), ch, 15700, 'recurring', 'monthly', current_date + interval '20 days', 'scheduled');

  insert into public.zelle_contacts (user_id, name, email_or_phone, bank) values
    (u, 'Alex Morgan', 'alex.morgan@example.com', 'Chase'),
    (u, 'Priya Patel', '512-555-0143', 'Bank of America'),
    (u, 'Marcus Reed', 'marcus.reed@example.com', 'Wells Fargo');

  insert into public.zelle_transfers (user_id, direction, contact_id, amount_cents, status, note, created_at) values
    (u, 'sent', (select id from public.zelle_contacts where user_id = u and name = 'Alex Morgan'), 25000, 'completed', 'Dinner & movie', now() - interval '2 days'),
    (u, 'received', (select id from public.zelle_contacts where user_id = u and name = 'Priya Patel'), 18000, 'completed', 'Split utilities', now() - interval '5 days'),
    (u, 'sent', (select id from public.zelle_contacts where user_id = u and name = 'Marcus Reed'), 4000, 'completed', 'Coffee', now() - interval '9 days');

  insert into public.transactions (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference) values
    (ln, u, 'Monthly vehicle payment', 'USAA Auto Loan', 'Loan', -145000, 'posted', now() - interval '11 days', 'LOAN-2571'),
    (cc, u, 'Whole Foods Market', 'Whole Foods', 'Groceries', -6200, 'posted', now() - interval '1 day', 'CC-8813'),
    (cc, u, 'Costco Wholesale', 'Costco', 'Groceries', -14020, 'posted', now() - interval '2 days', 'CC-8814'),
    (cc, u, 'Shell Gas Station', 'Shell', 'Fuel', -3900, 'posted', now() - interval '3 days', 'CC-8815'),
    (cc, u, 'Netflix', 'Netflix', 'Entertainment', -1599, 'posted', now() - interval '4 days', 'CC-8816'),
    (cc, u, 'Amazon', 'Amazon', 'Shopping', -8940, 'posted', now() - interval '5 days', 'CC-8817'),
    (cc, u, 'Delta Air Lines', 'Delta', 'Travel', -41500, 'posted', now() - interval '8 days', 'CC-8818'),
    (cc, u, 'Preferred Rewards cashback', 'USAA', 'Rewards', 12500, 'posted', now() - interval '10 days', 'CC-8819'),
    (cc, u, 'CVS Pharmacy', 'CVS', 'Health', -2380, 'posted', now() - interval '12 days', 'CC-8820'),
    (ch, u, 'Automated Payroll Deposit', 'Microsoft', 'Income', 642000, 'posted', now() - interval '14 days', 'DD-USAA'),
    (ch, u, 'Transfer from Savings', 'USAA Transfer', 'Transfer', 100000, 'posted', now() - interval '14 days', 'TR-1022'),
    (ch, u, 'United Airlines', 'United', 'Travel', -28750, 'pending', now() - interval '6 hours', 'SP-8821'),
    (ch, u, 'Taco Bell', 'Taco Bell', 'Dining', -1250, 'posted', now(), 'SP-8822');

  insert into public.investment_holdings (account_id, user_id, symbol, name, shares, avg_cost_cents, current_price_cents) values
    (iv, u, 'VTSAX', 'Vanguard Total Stock Market Index', 120.5000, 10149, 10420),
    (iv, u, 'VXUS', 'Vanguard Total International Stock', 220.1000, 4120, 4155),
    (iv, u, 'BND', 'Vanguard Total Bond Market', 150.0000, 7400, 7550);

  insert into public.cards (user_id, account_id, card_last4, brand, card_type, status, expires) values
    (u, ch, '7931', 'Visa', 'debit', 'active', '07/29'),
    (u, cc, '2210', 'Visa', 'credit', 'active', '09/30');

  insert into public.alert_preferences (user_id) values (u);
  insert into public.alerts (user_id, title, message, severity, read, created_at) values
    (u, 'Direct deposit received', 'Your payroll deposit of $6,420.00 posted to Secure Checking', 'success', true, now() - interval '1 day'),
    (u, 'Low balance alert', 'Secure Checking dropped below your $500.00 threshold.', 'warning', false, now() - interval '3 days'),
    (u, 'Welcome to your demo account', 'You are in a demonstration environment. Account data is sample data.', 'info', false, now());

  return;
end;
$$;

-- -------------------------------------------------------------------------
-- Reset all demo data for the current user
-- -------------------------------------------------------------------------
create or replace function public.reset_demo_data()
returns void
language plpgsql
security definer set search_path = public
as $$
declare u uuid := auth.uid();
begin
  if u is null then raise exception 'not authenticated'; end if;
  delete from public.accounts where user_id = u;
  delete from public.payees where user_id = u;
  delete from public.zelle_contacts where user_id = u;
  delete from public.transfers where user_id = u;
  delete from public.bill_payments where user_id = u;
  delete from public.zelle_transfers where user_id = u;
  delete from public.transactions where user_id = u;
  delete from public.cards where user_id = u;
  delete from public.investment_holdings where user_id = u;
  delete from public.alerts where user_id = u;
  delete from public.disputes where user_id = u;
  delete from public.alert_preferences where user_id = u;
  perform public.seed_demo_data();
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
-- Grants
-- -------------------------------------------------------------------------
grant execute on function public.create_demo_code(text) to anon, authenticated;
grant execute on function public.verify_demo_code(text, text) to anon, authenticated;
grant execute on function public.seed_demo_data() to anon, authenticated;
grant execute on function public.reset_demo_data() to anon, authenticated;
grant execute on function public.make_internal_transfer(uuid, uuid, bigint, text, text, timestamptz, text) to anon, authenticated;
grant execute on function public.make_external_transfer(uuid, text, bigint, text, text, text, timestamptz, text) to anon, authenticated;
grant execute on function public.make_bill_payment(uuid, uuid, bigint, text, text, timestamptz) to anon, authenticated;
grant execute on function public.make_zelle_transfer(uuid, bigint, text, text) to anon, authenticated;
grant execute on function public.set_card_status(uuid, text) to anon, authenticated;