-- =====================================================================
-- Member-to-member transfers by account number
-- 1) lookup_member_by_account: resolves an account number to the
--    member's name (powers the autofill in the transfer form).
-- 2) make_external_transfer reworked: for non-wire transfers the
--    recipient account number MUST match a USAA member account —
--    the member is then credited (balance + available) and both sides
--    get a transaction row. Wire stays a true external outflow.
-- Run this in the Supabase SQL editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Lookup: account number -> member name
-- ---------------------------------------------------------------------
create or replace function public.lookup_member_by_account(p_account_number text)
returns jsonb
language plpgsql
security definer set search_path = public
stable
as $$
declare
  u uuid := auth.uid();
  v_user uuid;
  v_name text;
  v_type text;
begin
  if u is null then raise exception 'not authenticated'; end if;

  select a.user_id, trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), a.type
    into v_user, v_name, v_type
    from public.accounts a
    join public.profiles p on p.user_id = a.user_id
   where a.account_number = btrim(coalesce(p_account_number, ''))
     and a.type in ('checking', 'savings')
   limit 1;

  if v_user is null then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object('found', true, 'name', v_name, 'account_type', v_type);
end;
$$;

grant execute on function public.lookup_member_by_account(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- External transfer: member-to-member by account number
-- ---------------------------------------------------------------------
drop function if exists public.make_external_transfer(uuid, text, bigint, text, text, text, timestamptz, text, text);

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
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_t uuid;
  v_recipient uuid;
  v_recipient_name text;
  v_sender_name text;
  v_account_number text := btrim(coalesce(p_external_account, ''));
begin
  if u is null then raise exception 'not authenticated'; end if;
  if p_amount <= 0 then raise exception 'invalid amount'; end if;

  if exists (select 1 from public.accounts where id = p_from and restricted) then
    raise exception 'This account is restricted and cannot send money';
  end if;

  if p_type = 'wire' then
    -- wire stays a true external outflow: no member lookup or crediting
    update public.accounts set balance_cents = balance_cents - p_amount,
           available_cents = available_cents - p_amount
     where id = p_from and user_id = u and available_cents - p_amount >= 0;
    if not found then raise exception 'insufficient funds'; end if;

    insert into public.transfers (user_id, from_account_id, external_name, external_account, amount_cents, transfer_type, schedule, frequency, next_run, status, note)
    values (u, p_from, p_external_name, nullif(v_account_number, ''), p_amount, 'wire', p_schedule, p_frequency, coalesce(p_next_run, now()), 'completed', p_note)
    returning id into v_t;

    insert into public.transactions (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
    values (p_from, u, 'Wire transfer to ' || coalesce(p_external_name, 'External'),
            null, 'Wire Transfer', -p_amount, 'posted', now(), 'TRF-' || left(v_t::text, 6));

    return jsonb_build_object('transfer_id', v_t, 'recipient_name', p_external_name, 'recipient_found', false);
  end if;

  -- member-to-member: the account number MUST match a USAA member account
  if v_account_number = '' then
    raise exception 'Recipient account number is required';
  end if;

  select a.id, trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''))
    into v_recipient, v_recipient_name
    from public.accounts a
    join public.profiles p on p.user_id = a.user_id
   where a.account_number = v_account_number
     and a.type in ('checking', 'savings')
   limit 1;

  if v_recipient is null then
    raise exception 'Account not found. Enter a valid USAA member account number';
  end if;

  if exists (select 1 from public.accounts where id = v_recipient and user_id = u) then
    raise exception 'You cannot transfer to your own account — use My accounts';
  end if;

  update public.accounts set balance_cents = balance_cents - p_amount,
         available_cents = available_cents - p_amount
   where id = p_from and user_id = u and available_cents - p_amount >= 0;
  if not found then raise exception 'insufficient funds'; end if;

  update public.accounts set balance_cents = balance_cents + p_amount,
         available_cents = available_cents + p_amount
   where id = v_recipient;
  if not found then raise exception 'recipient account unavailable'; end if;

  select trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
    into v_sender_name
    from public.profiles where user_id = u;

  insert into public.transfers (user_id, from_account_id, to_account_id, external_name, external_account, amount_cents, transfer_type, schedule, frequency, next_run, status, note)
  values (u, p_from, v_recipient, v_recipient_name, v_account_number, p_amount, 'external', p_schedule, p_frequency, coalesce(p_next_run, now()), 'completed', p_note)
  returning id into v_t;

  insert into public.transactions (account_id, user_id, description, merchant, category, amount_cents, status, posted_at, reference)
  values
    (p_from, u, 'Transfer to ' || v_recipient_name, v_recipient_name, 'Transfer', -p_amount, 'posted', now(), 'TRF-' || left(v_t::text, 6)),
    (v_recipient, (select user_id from public.accounts where id = v_recipient), 'Transfer from ' || coalesce(v_sender_name, 'Member'), coalesce(v_sender_name, 'Member'), 'Transfer', p_amount, 'posted', now(), 'TRF-' || left(v_t::text, 6));

  return jsonb_build_object('transfer_id', v_t, 'recipient_name', v_recipient_name, 'recipient_found', true);
end;
$$;

grant execute on function public.make_external_transfer(uuid, text, bigint, text, text, text, timestamptz, text, text) to anon, authenticated;
