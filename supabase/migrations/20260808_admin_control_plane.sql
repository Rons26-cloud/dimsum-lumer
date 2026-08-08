-- Shared control plane for admin-dashboard, frontend-web, and mobile-apk.
insert into public.app_config(key, value)
values ('home_banners', '{"items":[]}'::jsonb)
on conflict (key) do nothing;

alter table public.app_config replica identity full;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'app_config','products','categories','flash_sales','promos','orders',
    'order_items','order_detail','profiles','wishlist','stores','notifications'
  ] loop
    if to_regclass('public.' || table_name) is not null and not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
