-- Jalankan melalui Supabase SQL Editor setelah meninjau nama tabel proyek.
-- Fungsi SECURITY DEFINER ini mencegah policy profiles mengalami rekursi.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  ) or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'superadmin'), false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Aktifkan RLS. Policy SELECT untuk aplikasi pelanggan yang sudah ada tetap dipertahankan.
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
      'create policy admin_manage on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      table_name
    );
  end loop;
end $$;

-- Storage: dashboard hanya boleh menulis bucket yang dikenal dan harus admin.
drop policy if exists admin_manage_dashboard_files on storage.objects;
create policy admin_manage_dashboard_files
on storage.objects for all to authenticated
using (bucket_id in ('product-images','category-images','banners') and public.is_admin())
with check (bucket_id in ('product-images','category-images','banners') and public.is_admin());
