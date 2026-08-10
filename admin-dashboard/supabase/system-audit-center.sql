-- Pusat audit, kesehatan, dan notifikasi operasional Dashboard.
-- Jalankan sekali melalui Supabase SQL Editor. Aman dijalankan ulang.
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  detail text,
  created_at timestamptz default now()
);
alter table public.activity_logs
  add column if not exists entity_table text,
  add column if not exists entity_id text,
  add column if not exists old_data jsonb,
  add column if not exists new_data jsonb,
  add column if not exists occurred_at timestamptz default now();

create or replace function public.capture_admin_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare row_id text; description text;
begin
  row_id := coalesce(case when tg_op='DELETE' then to_jsonb(old)->>'id' else to_jsonb(new)->>'id' end, 'unknown');
  description := case tg_op when 'INSERT' then 'Menambahkan data baru' when 'UPDATE' then 'Memperbarui data' else 'Menghapus data' end || ' pada ' || tg_table_name;
  insert into public.activity_logs(admin_id,action,detail,entity_table,entity_id,old_data,new_data,created_at,occurred_at)
  values(auth.uid(),tg_op,description,tg_table_name,row_id,case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end,now(),now());
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;

do $$ declare table_name text;
begin
  foreach table_name in array array['products','categories','flash_sales','promos','orders','stores','maintenance','app_config'] loop
    if to_regclass('public.'||table_name) is not null then
      execute format('drop trigger if exists admin_audit_trigger on public.%I',table_name);
      execute format('create trigger admin_audit_trigger after insert or update or delete on public.%I for each row execute function public.capture_admin_audit()',table_name);
    end if;
  end loop;
end $$;

alter table public.activity_logs enable row level security;
drop policy if exists admin_read_activity_logs on public.activity_logs;
create policy admin_read_activity_logs on public.activity_logs for select to authenticated using(public.is_admin());
create index if not exists activity_logs_time_idx on public.activity_logs(occurred_at desc);
create index if not exists activity_logs_entity_idx on public.activity_logs(entity_table,entity_id);

-- Kolom lintas Web/APK untuk notifikasi operasional.
alter table public.notifications
  add column if not exists message text,
  add column if not exists type text default 'system',
  add column if not exists order_id uuid;

create or replace function public.notify_admins_new_order()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id,title,body,message,type,order_id,is_read,created_at)
  select p.id,'Pesanan baru masuk','Pesanan baru menunggu pemeriksaan admin.','Pesanan baru menunggu pemeriksaan admin.','order_new',new.id,false,now()
  from public.profiles p where p.role in ('admin','superadmin');
  return new;
end; $$;
drop trigger if exists notify_admin_new_order_trigger on public.orders;
create trigger notify_admin_new_order_trigger after insert on public.orders for each row execute function public.notify_admins_new_order();

do $$ begin alter publication supabase_realtime add table public.activity_logs; exception when duplicate_object then null; end $$;
notify pgrst, 'reload schema';
