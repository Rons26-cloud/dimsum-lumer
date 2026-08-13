-- Read-only post-deployment checks for the final production security baseline.
-- Run in Supabase SQL Editor after 20260813_production_security_remediation.sql.

select
  p.proname as function_name,
  p.prosecdef as security_definer,
  coalesce(array_to_string(p.proconfig, ', '), '(not set)') as function_config,
  has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_admin',
    'is_superadmin',
    'has_admin_mfa',
    'assert_superadmin_mfa',
    'admin_promote_new_account',
    'admin_delete_admin_account',
    'protect_profile_privileged_fields',
    'submit_payment_proof',
    'checkout_order_v2'
  )
order by p.proname;

-- Must return true for an AAL2 superadmin session and false for an AAL1
-- session. Run this statement while authenticated as the account under test.
select public.is_superadmin() as is_superadmin,
       public.has_admin_mfa() as has_aal2;

-- Must return zero rows: no broad legacy profile management policy may remain.
select schemaname, tablename, policyname, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
  and policyname in ('admin_manage', 'admin manage profiles');

-- Must return zero rows: the discount-from-client RPC and obsolete checkout
-- overload must not exist in production.
select n.nspname as schema_name, p.proname, pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and (
  p.proname = 'create_checkout_order'
  or (p.proname = 'checkout_order_v2'
      and pg_get_function_identity_arguments(p.oid) <>
        'p_shipping_cost numeric, p_shipping_method text, p_payment_method text, p_shipping_address text, p_customer_lat double precision, p_customer_lng double precision, p_items jsonb, p_promo_code text')
);

-- APK writes must be superadmin-only and broad legacy policies must be absent.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename = 'app_config')
   or (schemaname = 'storage' and tablename = 'objects'
       and policyname ilike '%APK%')
order by schemaname, tablename, policyname;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename in (
  'profiles', 'orders', 'order_items', 'cart_items', 'notifications'
)) or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, policyname;

select
  b.id,
  b.public,
  b.file_size_limit,
  b.allowed_mime_types
from storage.buckets b
where b.id = 'payment-proofs';

select
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  not t.tgisinternal as enabled_custom_trigger
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_proc p on p.oid = t.tgfoid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and (
    (c.relname = 'profiles' and t.tgname = 'protect_profile_privileged_fields_trigger')
    or (c.relname = 'orders' and t.tgname = 'protect_order_financial_snapshot_trigger')
  );
