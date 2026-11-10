-- BBB admin identity hardening, applied to live Supabase 2026-11-10.
-- The original check matched only a signed token's email claim.
-- Require auth.uid() to identify the matching confirmed account in auth.users.
-- Safe for the existing BBB owner: the approved identity was confirmed before
-- applying the live migration.
--
-- Read-only verification executed after migration:
--   approved confirmed owner -> admin_get_prospect_lab returns JSON array;
--   unrelated auth.uid -> "Admin access required";
--   anon -> cannot execute admin grading/publishing RPCs.
create or replace function private.is_bbb_admin()
returns boolean
language sql stable security definer
set search_path to 'pg_catalog'
as $$
 select exists (
  select 1
  from public.bbb_admin_users a
  join auth.users u on lower(u.email)=lower(a.email)
  where a.active
    and u.email_confirmed_at is not null
    and u.id=(select auth.uid())
 );
$$;

comment on function private.is_bbb_admin() is
'Owner-only authorization bound to a confirmed auth.users identity (auth.uid), never an unverified or independently supplied email claim.';
