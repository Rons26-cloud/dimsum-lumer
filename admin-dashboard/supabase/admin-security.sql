create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'superadmin')
    );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

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

revoke all on function public.is_admin_aal2() from public;
grant execute on function public.is_admin_aal2() to anon, authenticated;

alter table if exists public.products enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.flash_sales enable row level security;
alter table if exists public.promos enable row level security;
alter table if exists public.orders enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.stores enable row level security;
alter table if exists public.app_config enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['products','categories','flash_sales','promos','orders','stores','app_config']
  loop
    execute format('drop policy if exists admin_manage on public.%I', table_name);
    execute format(
      'create policy admin_manage on public.%I for all to authenticated using (public.is_admin_aal2()) with check (public.is_admin_aal2())',
      table_name
    );
  end loop;
end $$;

drop policy if exists admin_manage_dashboard_files on storage.objects;
create policy admin_manage_dashboard_files
on storage.objects for all to authenticated
using (bucket_id in ('product-images','category-images','banners','store-photos') and public.is_admin_aal2())
with check (bucket_id in ('product-images','category-images','banners','store-photos') and public.is_admin_aal2());
