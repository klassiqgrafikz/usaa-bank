-- =====================================================================
-- USAA-style online banking portal
-- Virtual card management: full card numbers, CVVs, virtual card type,
-- frozen status, and a secure issue-card RPC.
-- Run this in the Supabase SQL editor AFTER schema.sql and seed.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------
alter table public.cards add column if not exists card_number text;
alter table public.cards add column if not exists cvv text;

-- ---------------------------------------------------------------------
-- 2. Widen the card_type and status constraints
-- ---------------------------------------------------------------------
alter table public.cards drop constraint if exists cards_card_type_check;
alter table public.cards add constraint cards_card_type_check
  check (card_type in ('debit', 'credit', 'virtual'));

alter table public.cards drop constraint if exists cards_status_check;
alter table public.cards add constraint cards_status_check
  check (status in ('active', 'locked', 'lost', 'stolen', 'frozen'));

-- ---------------------------------------------------------------------
-- 3. Luhn-valid card number generator
--    prefix: '4' for Visa, '5' for Mastercard
-- ---------------------------------------------------------------------
create or replace function public.generate_card_number(p_prefix text)
returns text
language plpgsql
set search_path = public
as $$
declare
  v_body text := '';
  v_i int;
  v_d int;
  v_sum int := 0;
  v_check int;
begin
  -- 15-digit body: prefix + 14 random digits
  v_body := p_prefix;
  for v_i in 1..14 loop
    v_body := v_body || ((random() * 10)::int % 10)::text;
  end loop;

  -- Luhn sum over the 15-digit body (rightmost digit position 1)
  for v_i in 1..15 loop
    v_d := (substr(v_body, 16 - v_i, 1))::int;
    if v_i % 2 = 0 then
      v_d := v_d * 2;
      if v_d > 9 then v_d := v_d - 9; end if;
    end if;
    v_sum := v_sum + v_d;
  end loop;

  v_check := (10 - v_sum % 10) % 10;
  return v_body || v_check::text;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. One-time backfill for existing cards
-- ---------------------------------------------------------------------
update public.cards
set card_number = public.generate_card_number(
      case when brand = 'Mastercard' then '5' else '4' end
    ),
    cvv = lpad(((random() * 1000)::int % 1000)::text, 3, '0')
where card_number is null;

-- ---------------------------------------------------------------------
-- 5. Issue a new virtual card (Visa or Mastercard only)
-- ---------------------------------------------------------------------
create or replace function public.issue_virtual_card(
  p_account uuid,
  p_network text
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_id uuid;
  v_num text;
begin
  if u is null then raise exception 'not authenticated'; end if;
  if p_network not in ('Visa', 'Mastercard') then
    raise exception 'network must be Visa or Mastercard';
  end if;
  if not exists (
    select 1 from public.accounts where id = p_account and user_id = u
  ) then
    raise exception 'account not found';
  end if;

  v_num := public.generate_card_number(
    case when p_network = 'Visa' then '4' else '5' end
  );

  insert into public.cards
    (user_id, account_id, card_last4, brand, card_type, status, expires,
     card_number, cvv)
  values
    (u, p_account,
     right(v_num, 4),
     p_network, 'virtual', 'active',
     to_char(current_date + interval '5 years', 'MM/YY'),
     v_num,
     lpad(((random() * 1000)::int % 1000)::text, 3, '0'))
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.issue_virtual_card(uuid, text) to authenticated;
