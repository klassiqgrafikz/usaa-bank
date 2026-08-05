-- =====================================================================
-- Fix: admin accounts showed "no accounts" for logged-in admins.
-- The old admin_list_accounts() joined auth.users for the member email,
-- which fails from the browser RPC path. Fix:
--   1) Store the member's email on public.profiles (kept in sync).
--   2) admin_list_accounts reads public.profiles only (no auth.* reads).
-- Run this in the Supabase SQL editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Email column on profiles + backfill
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.user_id
   and p.email is null;

-- ---------------------------------------------------------------------
-- 2) Keep email in sync for new signups
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email
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
-- 3) Rework admin_list_accounts: no auth.users join
-- ---------------------------------------------------------------------
create or replace function public.admin_list_accounts()
returns table (
  account_id uuid,
  user_id uuid,
  member_name text,
  email text,
  account_name text,
  account_type text,
  account_number text,
  routing_number text,
  balance_cents bigint,
  available_cents bigint,
  restricted boolean,
  created_at timestamptz,
  member_since timestamptz
)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin access required'; end if;

  return query
    select a.id,
           a.user_id,
           trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')) as member_name,
           p.email,
           a.name,
           a.type,
           a.account_number,
           a.routing_number,
           a.balance_cents,
           a.available_cents,
           a.restricted,
           a.created_at,
           p.member_since
      from public.accounts a
      join public.profiles p on p.user_id = a.user_id
     order by a.created_at desc, a.user_id;
end;
$$;

grant execute on function public.admin_list_accounts() to anon, authenticated;