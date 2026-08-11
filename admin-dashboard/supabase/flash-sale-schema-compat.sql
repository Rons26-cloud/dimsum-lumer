alter table public.flash_sales
  add column if not exists sale_price numeric(12,2),
  add column if not exists original_price numeric(12,2),
  add column if not exists flash_stock integer default 0,
  add column if not exists updated_at timestamptz default now();

update public.flash_sales fs
set
  sale_price = coalesce(fs.sale_price, fs.discount_price, 0),
  original_price = coalesce(fs.original_price, p.price, fs.discount_price, 0),
  flash_stock = coalesce(fs.flash_stock, fs.stock, 0),
  updated_at = coalesce(fs.updated_at, now())
from public.products p
where p.id = fs.product_id
  and (fs.sale_price is null or fs.original_price is null);

alter table public.flash_sales
  alter column sale_price set default 0,
  alter column original_price set default 0,
  alter column sale_price set not null,
  alter column original_price set not null;

create or replace function public.touch_flash_sale_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_flash_sale_updated_at on public.flash_sales;
create trigger trg_touch_flash_sale_updated_at
before update on public.flash_sales
for each row execute function public.touch_flash_sale_updated_at();

notify pgrst, 'reload schema';
