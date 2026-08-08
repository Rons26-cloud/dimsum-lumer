-- Checkout atomik, snapshot alamat, dan koordinat GPS pengiriman.
alter table addresses add column if not exists phone text;
alter table addresses add column if not exists landmark text;
alter table addresses add column if not exists updated_at timestamptz default now();

alter table orders add column if not exists delivery_address text;
alter table orders add column if not exists delivery_latitude double precision;
alter table orders add column if not exists delivery_longitude double precision;
alter table orders add column if not exists location_accuracy double precision;
alter table orders add column if not exists location_updated_at timestamptz;

create or replace function create_checkout_order(
  p_address_id uuid,
  p_shipping_method text,
  p_payment_method text,
  p_insurance_fee numeric,
  p_discount numeric,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_address addresses%rowtype;
  v_product products%rowtype;
  v_order orders%rowtype;
  v_item jsonb;
  v_qty int;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_total numeric(12,2);
begin
  if v_user_id is null then raise exception 'Pengguna belum login'; end if;
  if p_payment_method not in ('transfer','qris','gopay','ovo','shopeepay','dana','cod') then raise exception 'Metode pembayaran tidak valid'; end if;
  v_shipping := case p_shipping_method when 'jne' then 18000 when 'jnt' then 22000 else null end;
  if v_shipping is null then raise exception 'Metode pengiriman tidak valid'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Keranjang kosong'; end if;

  select * into v_address from addresses where id = p_address_id and user_id = v_user_id;
  if not found then raise exception 'Alamat pengiriman tidak valid'; end if;
  if v_address.latitude is null or v_address.longitude is null then raise exception 'Alamat belum memiliki koordinat GPS'; end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(coalesce((v_item->>'quantity')::int, 0), 0);
    if v_qty < 1 then raise exception 'Jumlah produk tidak valid'; end if;
    select * into v_product from products where id = (v_item->>'product_id')::uuid and is_active = true for update;
    if not found then raise exception 'Produk tidak tersedia'; end if;
    if v_product.stock < v_qty then raise exception 'Stok % tidak mencukupi', v_product.name; end if;
    v_subtotal := v_subtotal + (v_product.price * v_qty);
  end loop;

  v_total := greatest(0, v_subtotal + v_shipping + greatest(p_insurance_fee, 0) - greatest(p_discount, 0));
  insert into orders (user_id, address_id, status, subtotal, discount, shipping_fee, total, payment_method, notes, delivery_address, delivery_latitude, delivery_longitude)
  values (v_user_id, v_address.id, 'pending', v_subtotal, greatest(p_discount, 0), v_shipping + greatest(p_insurance_fee, 0), v_total, p_payment_method, 'Pengiriman: ' || p_shipping_method, v_address.full_address, v_address.latitude, v_address.longitude)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    select * into v_product from products where id = (v_item->>'product_id')::uuid;
    insert into order_detail (order_id, product_id, product_name, price, qty, subtotal)
    values (v_order.id, v_product.id, v_product.name, v_product.price, v_qty, v_product.price * v_qty);
  end loop;

  delete from cart_items where user_id = v_user_id;
  return jsonb_build_object('id', v_order.id, 'order_code', v_order.order_code, 'total', v_order.total, 'status', v_order.status);
end;
$$;

revoke all on function create_checkout_order(uuid, text, text, numeric, numeric, jsonb) from public;
grant execute on function create_checkout_order(uuid, text, text, numeric, numeric, jsonb) to authenticated;

create or replace function update_own_order_location(
  p_order_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy double precision
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then
    raise exception 'Koordinat GPS tidak valid';
  end if;
  update orders set
    delivery_latitude = p_latitude,
    delivery_longitude = p_longitude,
    location_accuracy = greatest(p_accuracy, 0),
    location_updated_at = now(),
    updated_at = now()
  where id = p_order_id and user_id = auth.uid() and status not in ('completed', 'cancelled');
  if not found then raise exception 'Pesanan tidak ditemukan atau tidak dapat diperbarui'; end if;
end;
$$;

revoke all on function update_own_order_location(uuid, double precision, double precision, double precision) from public;
grant execute on function update_own_order_location(uuid, double precision, double precision, double precision) to authenticated;
