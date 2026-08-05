-- =====================================================================
-- Admin: all accounts + editable membership date
-- 1) admin_list_accounts: every account joined with member name + email.
-- 2) admin_update_member_since: edit a member's membership timestamp.
-- Run this in the Supabase SQL editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- List every account with the member it belongs to
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
           u.email,
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
      join auth.users u on u.id = a.user_id
     order by a.created_at desc, a.user_id;
end;
$$;

grant execute on function public.admin_list_accounts() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Edit a member's membership date
-- ---------------------------------------------------------------------
create or replace function public.admin_update_member_since(
  p_user_id uuid,
  p_member_since timestamptz
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin access required'; end if;
  if p_member_since is null then raise exception 'member since date is required'; end if;

  update public.profiles
     set member_since = p_member_since
   where user_id = p_user_id;
  if not found then raise exception 'member not found'; end if;

  return jsonb_build_object('updated', true, 'member_since', p_member_since);
end;
$$;

grant execute on function public.admin_update_member_since(uuid, timestamptz) to anon, authenticated;