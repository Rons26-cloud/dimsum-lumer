-- Final-state security remediation: enforce MFA/AAL2 for administrator actions.
-- Safe to run after historical migrations; no tables or production rows are removed.
begin;

-- Avoid waiting indefinitely behind dashboard/realtime traffic. A timeout rolls the
-- entire migration back, so it can be retried during a quieter maintenance window.
-- Policy/trigger replacement membutuhkan lock tabel. Lima detik terlalu mudah
-- gagal ketika dashboard admin atau Realtime sedang memakai koneksi aktif.
set local lock_timeout = '30s';
set local statement_timeout = '2min';
set local statement_timeout = '60s';

-- Role-only predicate. Keep this separate for non-sensitive role-aware behaviour.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('admin', 'superadmin')
    );
$$;

-- Sensitive administrator predicate. The assurance claim comes from the validated
-- Supabase JWT supplied by PostgREST, never from a client-controlled table/parameter.
create or replace function public.is_admin_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

create or replace function public.assert_admin_aal2()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin_aal2() then
    raise exception using
      errcode = '42501',
      message = 'Administrator AAL2 authentication required';
  end if;
end;
$$;

create or replace function public.is_superadmin_aal2()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin_aal2()
    and public.is_superadmin();
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin_aal2() from public;
revoke all on function public.assert_admin_aal2() from public;
revoke all on function public.is_superadmin_aal2() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_admin_aal2() to anon, authenticated;
grant execute on function public.assert_admin_aal2() to authenticated;
grant execute on function public.is_superadmin_aal2() to anon, authenticated;

-- Replace only administrator branches in existing policies. Customer/public
-- predicates in the same policy are retained verbatim.
do $migration$
declare
  policy_record record;
  role_list text;
  using_clause text;
  check_clause text;
  create_statement text;
begin
  for policy_record in
    select *
    from pg_policies
    where schemaname in ('public', 'storage')
      and (
        coalesce(qual, '') like '%public.is_admin()%'
        or coalesce(with_check, '') like '%public.is_admin()%'
        or coalesce(qual, '') like '%public.is_superadmin()%'
        or coalesce(with_check, '') like '%public.is_superadmin()%'
      )
  loop
    select string_agg(quote_ident(role_name), ', ')
      into role_list
    from unnest(policy_record.roles) as role_name;

    using_clause := case when policy_record.qual is null then '' else
      ' using (' || replace(replace(policy_record.qual,
        'public.is_admin()', 'public.is_admin_aal2()'),
        'public.is_superadmin()', 'public.is_superadmin_aal2()') || ')' end;
    check_clause := case when policy_record.with_check is null then '' else
      ' with check (' || replace(replace(policy_record.with_check,
        'public.is_admin()', 'public.is_admin_aal2()'),
        'public.is_superadmin()', 'public.is_superadmin_aal2()') || ')' end;

    execute format('drop policy %I on %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
    create_statement := format(
      'create policy %I on %I.%I as %s for %s to %s%s%s',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename,
      policy_record.permissive,
      policy_record.cmd,
      coalesce(role_list, 'public'),
      using_clause,
      check_clause
    );
    execute create_statement;
  end loop;
end
$migration$;

-- Apply the same final-state gate to existing SECURITY DEFINER RPC/trigger
-- functions that previously trusted the role-only predicate. Excluding the two
-- predicates themselves prevents recursion and keeps is_admin() role-only.
do $migration$
declare
  function_record record;
  definition text;
begin
  for function_record in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and p.proname not in ('is_admin', 'is_admin_aal2', 'is_superadmin', 'is_superadmin_aal2', 'has_admin_mfa', 'assert_admin_aal2')
      and (
        pg_get_functiondef(p.oid) like '%public.is_admin()%'
        or pg_get_functiondef(p.oid) like '%public.is_superadmin()%'
      )
  loop
    definition := replace(replace(
      pg_get_functiondef(function_record.oid),
      'public.is_admin()',
      'public.is_admin_aal2()'
    ), 'public.is_superadmin()', 'public.is_superadmin_aal2()');
    execute definition;
  end loop;
end
$migration$;

-- app_config is mixed-use. Only explicitly classified rows are client-readable;
-- new keys default to internal. Existing frontend keys are deliberately public.
alter table public.app_config
  add column if not exists is_public boolean not null default false;

update public.app_config
set is_public = true
where key in ('store_info', 'apk_version', 'welcome_intro', 'home_banners');

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.app_config'::regclass
      and conname = 'app_config_public_key_safety'
  ) then
    alter table public.app_config
      add constraint app_config_public_key_safety
      check (
        not is_public
        or key !~* '(secret|password|token|private[_-]?key|service[_-]?role|server[_-]?key)'
      );
  end if;
end
$migration$;

-- Remove any legacy unrestricted SELECT policy, regardless of its historical name.
do $migration$
declare policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_config'
      and cmd = 'SELECT'
      and lower(trim(both '()' from coalesce(qual, ''))) = 'true'
  loop
    execute format('drop policy %I on public.app_config', policy_record.policyname);
  end loop;
end
$migration$;

drop policy if exists "public reads public app config" on public.app_config;
create policy "public reads public app config"
on public.app_config for select to anon, authenticated
using (is_public = true);

-- Recreate the final administrator policy explicitly because app_config may have
-- been created by installations with different historical policy names.
drop policy if exists "admins manage public app config with aal2" on public.app_config;
create policy "admins manage public app config with aal2"
on public.app_config for all to authenticated
using (public.is_admin_aal2())
with check (public.is_admin_aal2());

comment on column public.app_config.is_public is
  'Only rows explicitly classified true may be exposed to anonymous/customer clients. Never store credentials in public rows.';

notify pgrst, 'reload schema';
commit;
