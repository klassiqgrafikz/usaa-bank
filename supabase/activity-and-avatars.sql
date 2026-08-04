-- =====================================================================
-- USAA-style online banking portal
-- Activity notifications + profile photos
--   1. Every transaction insert fires a bell notification (alerts table)
--   2. Card actions (issue / freeze / unfreeze) notify too
--   3. profiles.avatar_url column
--   4. Public 'avatars' storage bucket (per-user folder)
-- Run this in the Supabase SQL editor AFTER schema.sql, seed.sql,
-- check-deposit.sql and virtual-cards.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Transaction activity -> bell notification
-- ---------------------------------------------------------------------
create or replace function public.notify_activity()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_acct text;
  v_amount text;
  v_title text;
  v_severity text := 'info';
begin
  select name into v_acct from public.accounts where id = NEW.account_id;
  v_amount := to_char(abs(NEW.amount_cents) / 100.0, 'FM$9,999,990.00');

  if NEW.category = 'Income' then
    v_title := 'Deposit received';
    v_severity := 'success';
  elsif NEW.category = 'Transfer' then
    if NEW.amount_cents > 0 then
      v_title := 'Transfer received';
      v_severity := 'success';
    else
      v_title := 'Transfer sent';
    end if;
  elsif NEW.category = 'Bill Pay' then
    v_title := 'Bill payment';
  elsif NEW.category = 'Zelle' then
    if NEW.amount_cents > 0 then
      v_title := 'Zelle payment received';
      v_severity := 'success';
    else
      v_title := 'Zelle payment sent';
    end if;
  elsif NEW.category = 'Rewards' then
    v_title := 'Rewards posted';
    v_severity := 'success';
  else
    v_title := 'New ' || lower(NEW.category);
  end if;

  insert into public.alerts (user_id, title, message, severity)
  values (
    NEW.user_id,
    v_title,
    v_amount || ' · ' || NEW.description || coalesce(' · ' || v_acct, ''),
    v_severity
  );
  return NEW;
end;
$$;

drop trigger if exists on_transaction_activity on public.transactions;
create trigger on_transaction_activity
  after insert on public.transactions
  for each row execute procedure public.notify_activity();

-- ---------------------------------------------------------------------
-- 2. Card actions -> bell notification
-- ---------------------------------------------------------------------
create or replace function public.set_card_status(p_card uuid, p_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  u uuid := auth.uid();
  v_last4 text;
  v_title text;
  v_severity text := 'info';
begin
  if u is null then raise exception 'not authenticated'; end if;

  select card_last4 into v_last4 from public.cards where id = p_card and user_id = u;
  if not found then raise exception 'card not found'; end if;

  update public.cards set status = p_status where id = p_card and user_id = u;

  if p_status = 'frozen' then
    v_title := 'Card frozen';
    v_severity := 'warning';
  elsif p_status = 'active' then
    v_title := 'Card unfrozen';
  else
    v_title := 'Card status updated';
  end if;

  insert into public.alerts (user_id, title, message, severity)
  values (u, v_title, 'Card ending in ' || v_last4 || ' is now ' || p_status || '.', v_severity);
end;
$$;

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
  v_acct text;
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

  select name into v_acct from public.accounts where id = p_account;

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

  insert into public.alerts (user_id, title, message, severity)
  values (u, 'Virtual card issued',
          'A new ' || p_network || ' virtual card was issued for ' || v_acct || '.',
          'info');

  return v_id;
end;
$$;

grant execute on function public.set_card_status(uuid, text) to anon, authenticated;
grant execute on function public.issue_virtual_card(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3. Profile photos
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "upload own avatars" on storage.objects;
create policy "upload own avatars" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "read own avatars" on storage.objects;
create policy "read own avatars" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "update own avatars" on storage.objects;
create policy "update own avatars" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "delete own avatars" on storage.objects;
create policy "delete own avatars" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
