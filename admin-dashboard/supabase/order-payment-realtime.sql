-- Sinkronisasi pembayaran dan status pesanan secara realtime.
-- Jalankan melalui Supabase SQL Editor. Aman dijalankan ulang.
alter table public.orders
  add column if not exists payment_status text default 'unpaid',
  add column if not exists paid_amount numeric(12,2) default 0,
  add column if not exists payment_reference text,
  add column if not exists payment_provider text,
  add column if not exists bank_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_name text,
  add column if not exists ewallet_number text,
  add column if not exists payment_proof_url text,
  add column if not exists shipping_method text,
  add column if not exists delivery_latitude double precision,
  add column if not exists delivery_longitude double precision,
  add column if not exists updated_at timestamptz default now();

alter table public.orders drop constraint if exists orders_bank_account_number_format;
alter table public.orders add constraint orders_bank_account_number_format
  check (bank_account_number is null or bank_account_number ~ '^[0-9]{8,24}$');
alter table public.orders drop constraint if exists orders_ewallet_number_format;
alter table public.orders add constraint orders_ewallet_number_format
  check (ewallet_number is null or ewallet_number ~ '^[0-9]{9,15}$');
alter table public.orders drop constraint if exists orders_account_name_required;
alter table public.orders add constraint orders_account_name_required
  check ((bank_account_number is null and ewallet_number is null) or length(trim(coalesce(bank_account_name,''))) >= 3);

create or replace function public.sync_order_payment_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  if lower(coalesce(new.payment_status,'')) in ('paid','verified','success','settlement') then
    new.paid_amount := case when coalesce(new.paid_amount,0) > 0 then new.paid_amount else coalesce(
      nullif(to_jsonb(new)->>'total_amount','')::numeric,
      nullif(to_jsonb(new)->>'total_price','')::numeric,
      nullif(to_jsonb(new)->>'total','')::numeric,
      0
    ) end;
    if lower(coalesce(new.status,'')) in ('pending','menunggu','waiting','') then new.status := 'processing'; end if;
  end if;
  return new;
end; $$;

drop trigger if exists sync_order_payment_status_trigger on public.orders;
create trigger sync_order_payment_status_trigger before insert or update of payment_status,paid_amount,status on public.orders
for each row execute function public.sync_order_payment_status();

do $$ begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end $$;
notify pgrst, 'reload schema';
