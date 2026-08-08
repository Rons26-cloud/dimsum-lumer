-- Realtime control plane shared by admin-dashboard, frontend-web and mobile-apk.
create table if not exists public.app_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

insert into public.app_config(key,value) values
('store_info','{"name":"Dimsum Lumer - Hongkong Fashion","address":"Hongkong Fashion, Jalan Sisingamangaraja, Sudirejo II, Medan Amplas, Kota Medan, Sumatera Utara 20147","latitude":3.570776,"longitude":98.694665,"phone":"6288807597952","is_open":true,"open_time":"10:00","close_time":"22:00"}'::jsonb),
('apk_version','{"version":"1.0.0","download_url":"","force_update":false,"uploaded_at":null,"file_size":0}'::jsonb)
on conflict(key) do nothing;

alter table public.app_config enable row level security;
drop policy if exists "Public reads app config" on public.app_config;
create policy "Public reads app config" on public.app_config for select using (true);
drop policy if exists "Admins manage app config" on public.app_config;
create policy "Admins manage app config" on public.app_config for all to authenticated
using (exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','superadmin')))
with check (exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','superadmin')));

insert into storage.buckets(id,name,public) values('apk','apk',true)
on conflict(id) do update set public=true;
drop policy if exists "Public downloads APK" on storage.objects;
create policy "Public downloads APK" on storage.objects for select using(bucket_id='apk');
drop policy if exists "Admins manage APK" on storage.objects;
create policy "Admins manage APK" on storage.objects for all to authenticated
using(bucket_id='apk' and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','superadmin')))
with check(bucket_id='apk' and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','superadmin')));

do $$ begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='app_config') then
    alter publication supabase_realtime add table public.app_config;
  end if;
end $$;
notify pgrst, 'reload schema';

create or replace function public.guard_store_open() returns trigger language plpgsql as $$
begin
  if coalesce((select (value->>'is_open')::boolean from public.app_config where key='store_info'), true) = false
     and not exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','superadmin')) then
    raise exception 'Toko sedang tutup dan belum menerima pesanan baru';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_store_open on public.orders;
create trigger trg_guard_store_open before insert on public.orders for each row execute function public.guard_store_open();

create or replace function public.touch_app_config() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end $$;
drop trigger if exists trg_touch_app_config on public.app_config;
create trigger trg_touch_app_config before insert or update on public.app_config for each row execute function public.touch_app_config();

alter table public.app_config replica identity full;
do $$
declare table_name text;
begin
  foreach table_name in array array['orders','order_items','order_detail','products','categories','profiles','stores','promos','wishlist','app_config'] loop
    if to_regclass('public.'||table_name) is not null and not exists(
      select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name
    ) then execute format('alter publication supabase_realtime add table public.%I',table_name); end if;
  end loop;
end $$;

alter table public.notifications
  add column if not exists message text,
  add column if not exists type text default 'system',
  add column if not exists order_id uuid references public.orders(id) on delete set null;
update public.notifications set message=body where message is null;

create or replace function public.notify_order_status_change() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old.status is distinct from new.status and new.user_id is not null then
    insert into public.notifications(user_id,title,body,message,type,order_id)
    values(new.user_id,'Status Pesanan Diperbarui','Pesanan '||coalesce(new.order_code,new.id::text)||' sekarang: '||new.status,'Pesanan '||coalesce(new.order_code,new.id::text)||' sekarang: '||new.status,'order',new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_notify_order_status_change on public.orders;
create trigger trg_notify_order_status_change after update of status on public.orders for each row execute function public.notify_order_status_change();

create or replace function public.notify_new_order() returns trigger language plpgsql security definer set search_path=public as $$
declare notification_text text := 'Pesanan '||coalesce(new.order_code,new.id::text)||' berhasil dibuat.';
begin
  if new.user_id is not null then
    insert into public.notifications(user_id,title,body,message,type,order_id)
    values(new.user_id,'Pesanan Dibuat',notification_text,notification_text,'order',new.id);
  end if;
  return new;
end $$;

drop policy if exists "Admins read wishlist" on public.wishlist;
create policy "Admins read wishlist" on public.wishlist for select to authenticated using(public.is_admin());

create or replace function public.sync_primary_store_config() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.app_config(key,value,updated_at,updated_by)
  values('store_info',jsonb_build_object('name',new.name,'address',new.address,'latitude',new.latitude,'longitude',new.longitude,'phone',new.phone,'open_time',new.open_time,'close_time',new.close_time,'is_open',new.is_open),now(),auth.uid())
  on conflict(key) do update set value=excluded.value,updated_at=now(),updated_by=auth.uid();
  return new;
end $$;
drop trigger if exists trg_sync_store_config on public.stores;
create trigger trg_sync_store_config after insert or update on public.stores for each row execute function public.sync_primary_store_config();
