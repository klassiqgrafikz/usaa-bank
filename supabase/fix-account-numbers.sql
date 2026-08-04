-- =====================================================================
-- Fix: account number format
-- 1) Recreate ensure_member_data so NEW members get the corrected
--    10/16-digit numeric format instead of the old UUID-hex format.
-- 2) Rewrite only accounts still carrying the old hex format, leaving
--    already-correct accounts (e.g. admin) untouched.
-- Run this in the Supabase SQL editor.
-- =====================================================================

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

-- Rewrite only the accounts that still carry the old UUID-hex format.
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
  end
where account_number ~ '^[0-9a-f]{4} [0-9a-f]{4} [0-9a-f]{4} [0-9a-f]{4}$';

-- Old members still carry the real USAA ABA; switch to the synthetic one.
update public.accounts set routing_number = '107236411'
where routing_number = '314074269';
