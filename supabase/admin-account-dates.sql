-- =====================================================================
-- Admin: edit an account's "Created" date.
-- The member-facing "Opened" date now reads from accounts.created_at,
-- so editing this updates the member's account card / detail page too.
-- Run this in the Supabase SQL editor.
-- =====================================================================
create or replace function public.admin_update_account_created(
  p_account_id uuid,
  p_created_at timestamptz
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin access required'; end if;
  if p_created_at is null then raise exception 'created date is required'; end if;

  update public.accounts
     set created_at = p_created_at
   where id = p_account_id;
  if not found then raise exception 'account not found'; end if;

  return jsonb_build_object('updated', true, 'created_at', p_created_at);
end;
$$;

grant execute on function public.admin_update_account_created(uuid, timestamptz) to anon, authenticated;