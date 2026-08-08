-- Supabase menjadi sumber data tunggal untuk katalog, keranjang, pembayaran,
-- status pesanan dan struk pada frontend, APK, serta dashboard admin.

alter table public.cart_items
  add column if not exists flash_sale_id uuid,
  add column if not exists unit_price numeric,
  add column if not exists is_flash_sale boolean not null default false;

create unique index if not exists cart_items_user_product_variant_unique
  on public.cart_items(user_id, product_id, variant);

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_proof_url text,
  add column if not exists paid_at timestamptz,
  add column if not exists receipt_number text;

create or replace function public.add_cart_item(
  p_product_id uuid,
  p_quantity integer default 1,
  p_variant text default 'Original',
  p_flash_sale_id uuid default null,
  p_unit_price numeric default null
) returns public.cart_items
language plpgsql security invoker set search_path = public as $$
declare result public.cart_items;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.products where id=p_product_id and is_active=true) then
    raise exception 'Produk tidak tersedia';
  end if;
  insert into public.cart_items(user_id,product_id,quantity,variant,flash_sale_id,unit_price,is_flash_sale)
  values(auth.uid(),p_product_id,greatest(p_quantity,1),coalesce(nullif(p_variant,''),'Original'),p_flash_sale_id,p_unit_price,p_flash_sale_id is not null)
  on conflict(user_id,product_id,variant) do update
    set quantity=public.cart_items.quantity+excluded.quantity,
        flash_sale_id=excluded.flash_sale_id,
        unit_price=coalesce(excluded.unit_price,public.cart_items.unit_price),
        is_flash_sale=excluded.is_flash_sale
  returning * into result;
  return result;
end $$;

grant execute on function public.add_cart_item(uuid,integer,text,uuid,numeric) to authenticated;

insert into storage.buckets(id,name,public)
values('product-images','product-images',true)
on conflict(id) do update set public=true;

drop policy if exists "Public read product images" on storage.objects;
create policy "Public read product images" on storage.objects for select
using(bucket_id='product-images');

drop policy if exists "Admins manage product images" on storage.objects;
create policy "Admins manage product images" on storage.objects for all to authenticated
using(bucket_id='product-images' and exists(select 1 from public.profiles where id=auth.uid() and role='admin'))
with check(bucket_id='product-images' and exists(select 1 from public.profiles where id=auth.uid() and role='admin'));

do $$
declare table_name text;
begin
  foreach table_name in array array['products','cart_items','orders','order_items','notifications','flash_sales'] loop
    if to_regclass('public.'||table_name) is not null and not exists(
      select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=table_name
    ) then execute format('alter publication supabase_realtime add table public.%I',table_name); end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
