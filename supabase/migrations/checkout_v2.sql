-- Checkout v2: kompatibilitas kolom desain baru tanpa menghapus kolom legacy.
alter table orders add column if not exists total_amount numeric(12,2) default 0;
alter table orders add column if not exists shipping_cost numeric(12,2) default 0;
alter table orders add column if not exists shipping_method text;
alter table orders add column if not exists shipping_address text;
alter table orders add column if not exists customer_lat double precision;
alter table orders add column if not exists customer_lng double precision;
alter table orders add column if not exists is_flash_sale boolean default false;
alter table cart_items add column if not exists flash_sale_id uuid references flash_sales(id) on delete set null;
alter table cart_items add column if not exists unit_price numeric(12,2);
alter table cart_items add column if not exists is_flash_sale boolean default false;

create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity int not null check (quantity > 0),
  price numeric(12,2) not null check (price >= 0),
  variant text,
  flash_sale_id uuid references flash_sales(id) on delete set null,
  is_flash_sale boolean default false,
  created_at timestamptz default now()
);

alter table order_items add column if not exists flash_sale_id uuid references flash_sales(id) on delete set null;
alter table order_items add column if not exists is_flash_sale boolean default false;

create index if not exists idx_order_items_order on order_items(order_id);
alter table order_items enable row level security;

drop policy if exists "own order items select" on order_items;
create policy "own order items select" on order_items for select using (
  exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);
create or replace function checkout_order_v2(
  p_shipping_cost numeric,
  p_shipping_method text,
  p_payment_method text,
  p_shipping_address text,
  p_customer_lat double precision,
  p_customer_lng double precision,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order orders%rowtype;
  v_product products%rowtype;
  v_item jsonb;
  v_quantity int;
  v_total numeric(12,2) := 0;
  v_shipping_cost numeric(12,2);
  v_unit_price numeric(12,2);
  v_flash flash_sales%rowtype;
  v_has_flash boolean := false;
begin
  if v_user_id is null then raise exception 'Pengguna belum login'; end if;
  if coalesce(trim(p_shipping_address), '') = '' then raise exception 'Alamat pengiriman wajib diisi'; end if;
  if p_customer_lat not between -90 and 90 or p_customer_lng not between -180 and 180 then raise exception 'Koordinat tidak valid'; end if;
  if p_shipping_method not in ('gojek', 'grab', 'pickup') then raise exception 'Kurir tidak valid'; end if;
  v_shipping_cost := case p_shipping_method when 'gojek' then 18000 when 'grab' then 20000 when 'pickup' then 0 end;
  if p_payment_method not in ('transfer', 'qris', 'gopay', 'ovo', 'shopeepay', 'dana', 'cod') then raise exception 'Pembayaran tidak valid'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Keranjang kosong'; end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::int;
    select * into v_product from products where id = (v_item->>'product_id')::uuid and is_active = true for update;
    if not found then raise exception 'Produk tidak tersedia'; end if;
    if v_quantity < 1 or v_product.stock < v_quantity then raise exception 'Stok % tidak mencukupi', v_product.name; end if;
    v_unit_price := v_product.price;
    if nullif(v_item->>'flash_sale_id','') is not null then
      select * into v_flash from flash_sales where id=(v_item->>'flash_sale_id')::uuid and product_id=v_product.id and is_active=true and now() between starts_at and ends_at for update;
      if not found or v_flash.flash_stock < v_quantity then raise exception 'Flash Sale tidak tersedia atau stok habis'; end if;
      v_unit_price := v_flash.sale_price;
      v_has_flash := true;
    end if;
    v_total := v_total + (v_unit_price * v_quantity);
  end loop;

  insert into orders (
    user_id, status, subtotal, shipping_fee, total, payment_method,
    total_amount, shipping_cost, shipping_method, shipping_address,
    customer_lat, customer_lng, delivery_address, delivery_latitude, delivery_longitude, is_flash_sale
  ) values (
    v_user_id, 'pending', v_total, v_shipping_cost, v_total + v_shipping_cost, p_payment_method,
    v_total + v_shipping_cost, v_shipping_cost, p_shipping_method, p_shipping_address,
    p_customer_lat, p_customer_lng, p_shipping_address, p_customer_lat, p_customer_lng, v_has_flash
  ) returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item->>'quantity')::int;
    select * into v_product from products where id = (v_item->>'product_id')::uuid for update;
    v_unit_price := v_product.price;
    if nullif(v_item->>'flash_sale_id','') is not null then
      select * into v_flash from flash_sales where id=(v_item->>'flash_sale_id')::uuid for update;
      v_unit_price := v_flash.sale_price;
      update flash_sales set flash_stock=flash_stock-v_quantity where id=v_flash.id;
    end if;
    insert into order_items (order_id, product_id, quantity, price, variant, flash_sale_id, is_flash_sale)
    values (v_order.id, v_product.id, v_quantity, v_unit_price, nullif(v_item->>'variant', ''), nullif(v_item->>'flash_sale_id','')::uuid, nullif(v_item->>'flash_sale_id','') is not null);
    update products set stock = stock - v_quantity, sold_count = sold_count + v_quantity where id = v_product.id;
  end loop;

  delete from cart_items where user_id = v_user_id;
  return jsonb_build_object('id', v_order.id, 'order_code', v_order.order_code, 'total_amount', v_order.total_amount, 'status', v_order.status);
end;
$$;

revoke all on function checkout_order_v2(numeric, text, text, text, double precision, double precision, jsonb) from public;
grant execute on function checkout_order_v2(numeric, text, text, text, double precision, double precision, jsonb) to authenticated;
