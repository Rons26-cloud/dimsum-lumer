-- FINAL production security authority. The zzzz prefix is intentional because
-- legacy migrations in this repository are not timestamp-prefixed. Apply this
-- after every other migration. All monetary values are authoritative
-- database values; modified web/APK clients cannot submit their own prices.

begin;

-- Normalise the promo schema used by every client before defining the RPC.
alter table public.promos
  add column if not exists min_purchase numeric(12,2) not null default 0,
  add column if not exists max_discount numeric(12,2),
  add column if not exists usage_limit integer,
  add column if not exists used_count integer not null default 0;

do $$ begin
  alter table public.products add constraint products_price_nonnegative
    check (price >= 0) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.promos add constraint promos_discount_type_allowed
    check (discount_type in ('percentage', 'fixed')) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.promos add constraint promos_discount_value_valid
    check (discount_value >= 0 and (discount_type <> 'percentage' or discount_value <= 100)) not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.promos add constraint promos_limits_valid
    check (min_purchase >= 0 and (max_discount is null or max_discount >= 0)
      and (usage_limit is null or usage_limit >= 0) and used_count >= 0) not valid;
exception when duplicate_object then null; end $$;

-- Remove the legacy RPC that accepted an arbitrary client discount. Dropping
-- the function also removes every accumulated EXECUTE grant.
drop function if exists public.create_checkout_order(uuid, text, text, numeric, numeric, jsonb);

-- Remove the obsolete seven-argument checkout. Leaving overloads callable is
-- dangerous because an attacker can deliberately select the weakest overload.
drop function if exists public.checkout_order_v2(numeric, text, text, text, double precision, double precision, jsonb);

create or replace function public.checkout_order_v2(
  p_shipping_cost numeric,
  p_shipping_method text,
  p_payment_method text,
  p_shipping_address text,
  p_customer_lat double precision,
  p_customer_lng double precision,
  p_items jsonb,
  p_promo_code text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_cart public.cart_items%rowtype;
  v_product public.products%rowtype;
  v_flash public.flash_sales%rowtype;
  v_promo public.promos%rowtype;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_discount numeric(12,2) := 0;
  v_total numeric(12,2);
  v_unit_price numeric(12,2);
  v_item_count integer;
  v_has_flash boolean := false;
  v_clean_address text := trim(coalesce(p_shipping_address, ''));
  v_clean_code text := upper(trim(coalesce(p_promo_code, '')));
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  -- Do not blacklist normal punctuation. Reject control characters and enforce
  -- strict length/type bounds; SQL values remain parameterised by PostgreSQL.
  if char_length(v_clean_address) not between 8 and 500
     or v_clean_address ~ '[[:cntrl:]]' then
    raise exception 'Invalid shipping address';
  end if;
  if p_customer_lat is null or p_customer_lng is null
     or p_customer_lat not between -90 and 90
     or p_customer_lng not between -180 and 180 then
    raise exception 'Invalid coordinates';
  end if;
  if p_shipping_method not in ('gojek', 'grab', 'pickup') then raise exception 'Invalid courier'; end if;
  if p_payment_method not in ('transfer', 'qris', 'gopay', 'ovo', 'shopeepay', 'dana', 'cod') then
    raise exception 'Invalid payment method';
  end if;
  if v_clean_code <> '' and v_clean_code !~ '^[A-Z0-9_-]{3,32}$' then raise exception 'Invalid promo code'; end if;

  -- Intentionally ignore p_shipping_cost and p_items. They remain only for API
  -- compatibility. The server-side cart and fixed courier tariff are trusted.
  v_shipping := case p_shipping_method when 'gojek' then 18000 when 'grab' then 20000 else 0 end;
  select count(*) into v_item_count from public.cart_items where user_id = v_user_id;
  if v_item_count not between 1 and 50 then raise exception 'Invalid cart'; end if;

  for v_cart in
    select * from public.cart_items where user_id = v_user_id order by id for update
  loop
    if v_cart.quantity not between 1 and 99 then raise exception 'Invalid quantity'; end if;
    select * into strict v_product from public.products
      where id = v_cart.product_id and is_active = true for update;
    if v_product.price is null or v_product.price < 0 then raise exception 'Invalid catalog price'; end if;
    if v_product.stock < v_cart.quantity then raise exception 'Insufficient stock'; end if;
    v_unit_price := v_product.price;

    if v_cart.flash_sale_id is not null then
      select * into v_flash from public.flash_sales
       where id = v_cart.flash_sale_id and product_id = v_product.id
         and is_active = true and now() between starts_at and ends_at for update;
      if not found or v_flash.flash_stock < v_cart.quantity
         or v_flash.sale_price < 0 or v_flash.sale_price > v_product.price then
        raise exception 'Flash sale unavailable';
      end if;
      v_unit_price := v_flash.sale_price;
      v_has_flash := true;
    end if;
    v_subtotal := v_subtotal + (v_unit_price * v_cart.quantity);
  end loop;

  if v_clean_code <> '' then
    select * into v_promo from public.promos
     where upper(code) = v_clean_code and is_active = true
       and (start_date is null or start_date <= current_date)
       and (end_date is null or end_date >= current_date)
     for update;
    if not found then raise exception 'Promo unavailable'; end if;
    if v_subtotal < coalesce(v_promo.min_purchase, 0) then raise exception 'Promo minimum not reached'; end if;
    if v_promo.usage_limit is not null and v_promo.used_count >= v_promo.usage_limit then raise exception 'Promo quota exhausted'; end if;
    if v_promo.discount_value is null or v_promo.discount_value < 0 then raise exception 'Invalid promo value'; end if;
    if v_promo.discount_type = 'percentage' then
      if v_promo.discount_value not between 0 and 100 then raise exception 'Invalid promo value'; end if;
      v_discount := round(v_subtotal * v_promo.discount_value / 100, 2);
    elsif v_promo.discount_type = 'fixed' then
      v_discount := v_promo.discount_value;
    else
      raise exception 'Invalid promo type';
    end if;
    if v_promo.max_discount is not null then v_discount := least(v_discount, v_promo.max_discount); end if;
    v_discount := least(greatest(v_discount, 0), v_subtotal);
  end if;

  v_total := v_subtotal - v_discount + v_shipping;
  if v_subtotal <= 0 or v_total < 0 then raise exception 'Invalid order total'; end if;

  insert into public.orders(
    user_id, status, subtotal, discount, shipping_fee, total, payment_method,
    total_amount, shipping_cost, shipping_method, shipping_address, customer_lat,
    customer_lng, delivery_address, delivery_latitude, delivery_longitude, is_flash_sale
  ) values (
    v_user_id, 'pending', v_subtotal, v_discount, v_shipping, v_total, p_payment_method,
    v_total, v_shipping, p_shipping_method, v_clean_address, p_customer_lat,
    p_customer_lng, v_clean_address, p_customer_lat, p_customer_lng, v_has_flash
  ) returning * into v_order;

  for v_cart in
    select * from public.cart_items where user_id = v_user_id order by id for update
  loop
    select * into strict v_product from public.products where id = v_cart.product_id for update;
    v_unit_price := v_product.price;
    if v_cart.flash_sale_id is not null then
      select * into strict v_flash from public.flash_sales where id = v_cart.flash_sale_id for update;
      v_unit_price := v_flash.sale_price;
      update public.flash_sales set flash_stock = flash_stock - v_cart.quantity where id = v_flash.id;
    end if;
    insert into public.order_items(order_id, product_id, quantity, price, variant, flash_sale_id, is_flash_sale)
    values(v_order.id, v_product.id, v_cart.quantity, v_unit_price,
      left(regexp_replace(trim(coalesce(v_cart.variant, 'Original')), '[[:cntrl:]]', '', 'g'), 40),
      v_cart.flash_sale_id, v_cart.flash_sale_id is not null);
    update public.products set stock = stock - v_cart.quantity,
      sold_count = coalesce(sold_count, 0) + v_cart.quantity where id = v_product.id;
  end loop;

  if v_clean_code <> '' then
    update public.promos set used_count = used_count + 1 where id = v_promo.id;
  end if;
  delete from public.cart_items where user_id = v_user_id;
  return jsonb_build_object('id', v_order.id, 'order_code', v_order.order_code,
    'subtotal', v_subtotal, 'discount', v_discount, 'shipping_cost', v_shipping,
    'total_amount', v_total, 'status', v_order.status);
end;
$$;

revoke all on function public.checkout_order_v2(numeric, text, text, text, double precision, double precision, jsonb, text)
  from public, anon;
grant execute on function public.checkout_order_v2(numeric, text, text, text, double precision, double precision, jsonb, text)
  to authenticated;

-- Financial snapshots must never be edited after checkout. Status, payment
-- evidence, and fulfilment fields can still be updated by their authorised paths.
create or replace function public.protect_order_financial_snapshot()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.subtotal is distinct from old.subtotal
     or new.discount is distinct from old.discount
     or new.shipping_fee is distinct from old.shipping_fee
     or new.total is distinct from old.total
     or new.total_amount is distinct from old.total_amount
     or new.shipping_cost is distinct from old.shipping_cost
     or new.user_id is distinct from old.user_id then
    raise exception 'Order financial snapshot is immutable';
  end if;
  return new;
end;
$$;
revoke all on function public.protect_order_financial_snapshot() from public, anon, authenticated;
drop trigger if exists protect_order_financial_snapshot_trigger on public.orders;
create trigger protect_order_financial_snapshot_trigger before update on public.orders
for each row execute function public.protect_order_financial_snapshot();

-- Only a superadmin may create or alter catalogue prices, promotion monetary
-- rules, or flash-sale prices. A compromised ordinary admin remains unable to
-- manipulate the amount later used by checkout and the payment gateway.
create or replace function public.guard_financial_catalog_changes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  changed boolean := false;
  object_id text;
begin
  if tg_table_name = 'products' then
    changed := tg_op = 'INSERT' or new.price is distinct from old.price;
  elsif tg_table_name = 'promos' then
    changed := tg_op = 'INSERT'
      or new.discount_type is distinct from old.discount_type
      or new.discount_value is distinct from old.discount_value
      or new.min_purchase is distinct from old.min_purchase
      or new.max_discount is distinct from old.max_discount
      or new.usage_limit is distinct from old.usage_limit;
  elsif tg_table_name = 'flash_sales' then
    changed := tg_op = 'INSERT'
      or new.sale_price is distinct from old.sale_price
      or new.original_price is distinct from old.original_price
      or new.product_id is distinct from old.product_id;
  end if;

  if changed and not public.is_superadmin() then
    raise exception 'Superadmin permission required for financial changes';
  end if;
  if changed then
    object_id := coalesce(new.id::text, old.id::text);
    insert into public.activity_logs(admin_id, action, detail)
    values(auth.uid(), 'financial_catalog_change',
      left(tg_table_name || ':' || object_id || ':' || tg_op, 500));
  end if;
  return new;
end;
$$;
revoke all on function public.guard_financial_catalog_changes() from public, anon, authenticated;

drop trigger if exists guard_product_financial_changes on public.products;
create trigger guard_product_financial_changes before insert or update on public.products
for each row execute function public.guard_financial_catalog_changes();
drop trigger if exists guard_promo_financial_changes on public.promos;
create trigger guard_promo_financial_changes before insert or update on public.promos
for each row execute function public.guard_financial_catalog_changes();
drop trigger if exists guard_flash_sale_financial_changes on public.flash_sales;
create trigger guard_flash_sale_financial_changes before insert or update on public.flash_sales
for each row execute function public.guard_financial_catalog_changes();

-- Order line prices are an immutable checkout snapshot.
create or replace function public.reject_order_item_mutation()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'Order item snapshots are immutable';
end;
$$;
revoke all on function public.reject_order_item_mutation() from public, anon, authenticated;
drop trigger if exists reject_order_item_update_delete on public.order_items;
create trigger reject_order_item_update_delete before update or delete on public.order_items
for each row execute function public.reject_order_item_mutation();

-- app_config remains readable by clients. Ordinary admins may manage normal
-- presentation/store keys, while APK distribution is superadmin-only.
drop policy if exists "Admins manage app config" on public.app_config;
drop policy if exists "admins manage app config" on public.app_config;
drop policy if exists "admins manage non-APK config" on public.app_config;
drop policy if exists "superadmins manage APK config" on public.app_config;
create policy "admins manage non-APK config" on public.app_config
for all to authenticated
using (key <> 'apk_version' and public.is_admin())
with check (key <> 'apk_version' and public.is_admin());
create policy "superadmins manage APK config" on public.app_config
for all to authenticated
using (key = 'apk_version' and public.is_superadmin())
with check (key = 'apk_version' and public.is_superadmin());

-- Remove every broad APK writer policy accumulated by legacy migrations.
drop policy if exists "admin manage control plane files" on storage.objects;
drop policy if exists "Admins manage APK" on storage.objects;
drop policy if exists "admins manage APK" on storage.objects;
drop policy if exists "admins manage non-APK control plane files" on storage.objects;
drop policy if exists "superadmins manage APK" on storage.objects;
create policy "admins manage non-APK control plane files"
on storage.objects for all to authenticated
using (bucket_id in ('product-images','category-images','banners','store-photos') and public.is_admin())
with check (bucket_id in ('product-images','category-images','banners','store-photos') and public.is_admin());
create policy "superadmins manage APK"
on storage.objects for all to authenticated
using (bucket_id = 'apk' and public.is_superadmin())
with check (bucket_id = 'apk' and public.is_superadmin());

-- Explicit table privileges complement RLS. Customer roles never receive
-- direct write access to authoritative catalogue/order financial tables.
revoke insert, update, delete on public.products, public.promos, public.flash_sales,
  public.orders, public.order_items, public.order_detail from anon;
revoke insert, update, delete on public.orders, public.order_items, public.order_detail from authenticated;
grant select on public.products, public.promos, public.flash_sales to anon, authenticated;
grant insert, update, delete on public.products, public.promos, public.flash_sales to authenticated;
grant select, update on public.orders to authenticated;

notify pgrst, 'reload schema';
commit;
