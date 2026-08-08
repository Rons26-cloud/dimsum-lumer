-- ZERO-TRUST HARDENING FOR CUSTOMER DATA
-- Apply after every existing migration through Supabase SQL Editor/CLI.
-- Keep the service_role key only in trusted server/CI secrets, never in an APK.

begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'superadmin')
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Remove every accumulated permissive policy from sensitive tables. Multiple
-- old policies are OR-ed by PostgreSQL, so merely adding stricter ones is not enough.
do $policy_cleanup$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'profiles', 'addresses', 'orders', 'order_detail', 'order_items',
    'cart_items', 'wishlist', 'notifications', 'activity_logs'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      for policy_name in
        select policyname from pg_policies
        where schemaname = 'public' and tablename = table_name
      loop
        execute format('drop policy %I on public.%I', policy_name, table_name);
      end loop;
    end if;
  end loop;
end
$policy_cleanup$;

-- Profiles: a customer sees only their profile. Admins see all. Privileged
-- fields remain protected by protect_profile_privileged_fields_trigger.
create policy "profile owner read" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profile owner create" on public.profiles for insert to authenticated
with check (id = (select auth.uid()) and user_id = (select auth.uid()));
create policy "profile owner or admin update" on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select public.is_admin()))
with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "address owner or admin read" on public.addresses for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "address owner create" on public.addresses for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "address owner update" on public.addresses for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "address owner delete" on public.addresses for delete to authenticated
using (user_id = (select auth.uid()));

create policy "order owner or admin read" on public.orders for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admin updates orders" on public.orders for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "order item owner or admin read" on public.order_items for select to authenticated
using ((select public.is_admin()) or exists (
  select 1 from public.orders o
  where o.id = order_items.order_id and o.user_id = (select auth.uid())
));
create policy "order detail owner or admin read" on public.order_detail for select to authenticated
using ((select public.is_admin()) or exists (
  select 1 from public.orders o
  where o.id = order_detail.order_id and o.user_id = (select auth.uid())
));

create policy "cart owner read" on public.cart_items for select to authenticated
using (user_id = (select auth.uid()));
create policy "cart owner quantity update" on public.cart_items for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "cart owner delete" on public.cart_items for delete to authenticated
using (user_id = (select auth.uid()));
create policy "admin reads carts" on public.cart_items for select to authenticated
using ((select public.is_admin()));

create policy "wishlist owner read" on public.wishlist for select to authenticated
using (user_id = (select auth.uid()));
create policy "wishlist owner create" on public.wishlist for insert to authenticated
with check (user_id = (select auth.uid()));
create policy "wishlist owner delete" on public.wishlist for delete to authenticated
using (user_id = (select auth.uid()));
create policy "admin reads wishlist" on public.wishlist for select to authenticated
using ((select public.is_admin()));

create policy "notification owner read" on public.notifications for select to authenticated
using (user_id = (select auth.uid()));
create policy "notification owner marks read" on public.notifications for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "admin manages notifications" on public.notifications for all to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "admin reads activity logs" on public.activity_logs for select to authenticated
using ((select public.is_admin()));
create policy "admin creates activity logs" on public.activity_logs for insert to authenticated
with check ((select public.is_admin()) and admin_id = (select auth.uid()));

-- Table privileges are a second barrier in addition to RLS.
revoke all on public.profiles, public.addresses, public.orders,
  public.order_detail, public.order_items, public.cart_items, public.wishlist,
  public.notifications, public.activity_logs from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_detail, public.order_items to authenticated;
revoke insert, update on public.cart_items from authenticated;
grant select, delete on public.cart_items to authenticated;
grant update (quantity) on public.cart_items to authenticated;
grant select, insert, delete on public.wishlist to authenticated;
revoke update on public.notifications from authenticated;
grant select, insert on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;
grant select, insert on public.activity_logs to authenticated;

do $$ begin
  alter table public.cart_items add constraint cart_quantity_zero_trust
    check (quantity between 1 and 99) not valid;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter table public.cart_items add constraint cart_variant_zero_trust
    check (char_length(trim(variant)) between 1 and 40) not valid;
exception when duplicate_object then null;
end $$;

-- The signature stays compatible with all clients. Client-supplied price and
-- flash-sale identifiers are ignored; authoritative values come from tables.
create or replace function public.add_cart_item(
  p_product_id uuid,
  p_quantity integer default 1,
  p_variant text default 'Original',
  p_flash_sale_id uuid default null,
  p_unit_price numeric default null
) returns public.cart_items
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result public.cart_items;
  catalog_price numeric;
  clean_variant text := trim(coalesce(p_variant, ''));
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity not between 1 and 99 then raise exception 'Invalid quantity'; end if;
  if clean_variant = '' or char_length(clean_variant) > 40 then raise exception 'Invalid variant'; end if;
  select price into catalog_price from public.products
  where id = p_product_id and is_active = true and stock > 0;
  if not found then raise exception 'Product unavailable'; end if;
  insert into public.cart_items(user_id, product_id, quantity, variant, flash_sale_id, unit_price, is_flash_sale)
  values(auth.uid(), p_product_id, p_quantity, clean_variant, null, catalog_price, false)
  on conflict(user_id, product_id, variant) do update
    set quantity = least(public.cart_items.quantity + excluded.quantity, 99),
        unit_price = catalog_price, flash_sale_id = null,
        is_flash_sale = false, updated_at = now()
  returning * into result;
  return result;
end;
$$;
revoke all on function public.add_cart_item(uuid, integer, text, uuid, numeric) from public, anon;
grant execute on function public.add_cart_item(uuid, integer, text, uuid, numeric) to authenticated;

-- Checkout ignores the item/price list supplied by a modified client. It locks
-- and consumes the authenticated user's server-side cart in one transaction.
create or replace function public.checkout_order_v2(
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
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_cart public.cart_items%rowtype;
  v_product public.products%rowtype;
  v_flash public.flash_sales%rowtype;
  v_total numeric(12,2) := 0;
  v_shipping_cost numeric(12,2);
  v_unit_price numeric(12,2);
  v_has_flash boolean := false;
  v_item_count integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  if char_length(trim(coalesce(p_shipping_address, ''))) not between 8 and 500 then raise exception 'Invalid address'; end if;
  if p_customer_lat is null or p_customer_lng is null or p_customer_lat not between -90 and 90 or p_customer_lng not between -180 and 180 then raise exception 'Invalid coordinates'; end if;
  if p_shipping_method not in ('gojek', 'grab', 'pickup') then raise exception 'Invalid courier'; end if;
  if p_payment_method not in ('transfer', 'qris', 'gopay', 'ovo', 'shopeepay', 'dana', 'cod') then raise exception 'Invalid payment'; end if;
  v_shipping_cost := case p_shipping_method when 'gojek' then 18000 when 'grab' then 20000 else 0 end;

  select count(*) into v_item_count from public.cart_items where user_id = v_user_id;
  if v_item_count < 1 or v_item_count > 50 then raise exception 'Invalid cart'; end if;

  for v_cart in select * from public.cart_items where user_id = v_user_id order by id for update loop
    if v_cart.quantity not between 1 and 99 then raise exception 'Invalid quantity'; end if;
    select * into strict v_product from public.products where id = v_cart.product_id and is_active = true for update;
    if v_product.stock < v_cart.quantity then raise exception 'Insufficient stock'; end if;
    v_unit_price := v_product.price;
    if v_cart.flash_sale_id is not null then
      select * into v_flash from public.flash_sales
      where id = v_cart.flash_sale_id and product_id = v_product.id and is_active = true
        and now() between starts_at and ends_at for update;
      if not found or v_flash.flash_stock < v_cart.quantity then raise exception 'Flash sale unavailable'; end if;
      v_unit_price := v_flash.sale_price;
      v_has_flash := true;
    end if;
    v_total := v_total + (v_unit_price * v_cart.quantity);
  end loop;

  insert into public.orders(user_id, status, subtotal, shipping_fee, total, payment_method,
    total_amount, shipping_cost, shipping_method, shipping_address, customer_lat,
    customer_lng, delivery_address, delivery_latitude, delivery_longitude, is_flash_sale)
  values(v_user_id, 'pending', v_total, v_shipping_cost, v_total + v_shipping_cost,
    p_payment_method, v_total + v_shipping_cost, v_shipping_cost, p_shipping_method,
    trim(p_shipping_address), p_customer_lat, p_customer_lng, trim(p_shipping_address),
    p_customer_lat, p_customer_lng, v_has_flash)
  returning * into v_order;

  for v_cart in select * from public.cart_items where user_id = v_user_id order by id for update loop
    select * into strict v_product from public.products where id = v_cart.product_id for update;
    v_unit_price := v_product.price;
    if v_cart.flash_sale_id is not null then
      select * into strict v_flash from public.flash_sales where id = v_cart.flash_sale_id for update;
      v_unit_price := v_flash.sale_price;
      update public.flash_sales set flash_stock = flash_stock - v_cart.quantity where id = v_flash.id;
    end if;
    insert into public.order_items(order_id, product_id, quantity, price, variant, flash_sale_id, is_flash_sale)
    values(v_order.id, v_product.id, v_cart.quantity, v_unit_price, left(trim(v_cart.variant), 40), v_cart.flash_sale_id, v_cart.flash_sale_id is not null);
    update public.products set stock = stock - v_cart.quantity,
      sold_count = coalesce(sold_count, 0) + v_cart.quantity where id = v_product.id;
  end loop;
  delete from public.cart_items where user_id = v_user_id;
  return jsonb_build_object('id', v_order.id, 'order_code', v_order.order_code,
    'total_amount', v_order.total_amount, 'status', v_order.status);
end;
$$;
revoke all on function public.checkout_order_v2(numeric, text, text, text, double precision, double precision, jsonb) from public, anon;
grant execute on function public.checkout_order_v2(numeric, text, text, text, double precision, double precision, jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
