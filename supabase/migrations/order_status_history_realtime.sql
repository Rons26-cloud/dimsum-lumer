-- Riwayat status permanen untuk Web, APK, dan dashboard admin.
alter table public.orders
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text,
  add column if not exists updated_at timestamptz default now();

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','processing','shipping','completed','cancelled')),
  shipping_method text,
  cancellation_reason text,
  changed_at timestamptz not null default now()
);

create index if not exists order_status_history_order_changed_idx
on public.order_status_history(order_id, changed_at desc);

create index if not exists order_status_history_user_changed_idx
on public.order_status_history(user_id, changed_at desc);

alter table public.order_status_history enable row level security;
drop policy if exists "users read own order status history" on public.order_status_history;
create policy "users read own order status history"
on public.order_status_history for select to authenticated
using (auth.uid() = user_id);

create or replace function public.prepare_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status = 'cancelled' and (tg_op = 'INSERT' or old.status is distinct from 'cancelled') then
    new.cancelled_at := coalesce(new.cancelled_at, now());
  end if;
  return new;
end;
$$;

create or replace function public.record_order_status_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status or old.shipping_method is distinct from new.shipping_method then
    insert into public.order_status_history(user_id,order_id,status,shipping_method,cancellation_reason)
    values(new.user_id,new.id,new.status,new.shipping_method,new.cancellation_reason);
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_order_status_change_trigger on public.orders;
create trigger prepare_order_status_change_trigger
before insert or update of status, shipping_method, cancellation_reason on public.orders
for each row execute function public.prepare_order_status_change();

drop trigger if exists record_order_status_history_trigger on public.orders;
create trigger record_order_status_history_trigger
after insert or update of status, shipping_method, cancellation_reason on public.orders
for each row execute function public.record_order_status_history();

insert into public.order_status_history(user_id,order_id,status,shipping_method,cancellation_reason,changed_at)
select o.user_id,o.id,o.status,o.shipping_method,o.cancellation_reason,coalesce(o.updated_at,o.created_at,now())
from public.orders o
where o.user_id is not null
  and not exists(select 1 from public.order_status_history h where h.order_id=o.id);

do $$ begin
  alter publication supabase_realtime add table public.order_status_history;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
