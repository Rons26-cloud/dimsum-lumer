-- Run in Supabase SQL Editor after the existing project migrations.
-- Server-side checks remain effective even if somebody modifies the APK.

alter table public.cart_items enable row level security;

drop policy if exists "own cart items" on public.cart_items;
create policy "own cart items read"
on public.cart_items for select to authenticated
using (user_id = (select auth.uid()));

create policy "own cart items update"
on public.cart_items for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "own cart items delete"
on public.cart_items for delete to authenticated
using (user_id = (select auth.uid()));

-- Clients may change quantity or delete their rows, but cannot directly forge
-- user_id, product_id, unit_price, or flash-sale fields.
revoke insert, update on public.cart_items from anon, authenticated;
grant select, delete on public.cart_items to authenticated;
grant update (quantity) on public.cart_items to authenticated;

do $$ begin
  alter table public.cart_items add constraint cart_quantity_safe
    check (quantity between 1 and 99) not valid;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table public.cart_items add constraint cart_variant_safe
    check (char_length(variant) between 1 and 40) not valid;
exception when duplicate_object then null;
end $$;

-- Keep the old signature for app compatibility, but deliberately ignore prices
-- supplied by the client and read the authoritative price from products.
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
  clean_variant text := trim(p_variant);
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_quantity is null or p_quantity not between 1 and 99 then raise exception 'Invalid quantity'; end if;
  if clean_variant = '' or char_length(clean_variant) > 40 then raise exception 'Invalid variant'; end if;

  select price into catalog_price
  from public.products
  where id = p_product_id and is_active = true;
  if not found then raise exception 'Product unavailable'; end if;

  insert into public.cart_items(user_id, product_id, quantity, variant, flash_sale_id, unit_price, is_flash_sale)
  values(auth.uid(), p_product_id, p_quantity, clean_variant, null, catalog_price, false)
  on conflict(user_id, product_id, variant) do update
    set quantity = least(public.cart_items.quantity + excluded.quantity, 99),
        unit_price = catalog_price,
        flash_sale_id = null,
        is_flash_sale = false,
        updated_at = now()
  returning * into result;
  return result;
end $$;

revoke all on function public.add_cart_item(uuid, integer, text, uuid, numeric) from public, anon;
grant execute on function public.add_cart_item(uuid, integer, text, uuid, numeric) to authenticated;

-- A user may read their notifications and only flip is_read; arbitrary payload
-- or user_id changes are denied at the privilege layer.
alter table public.notifications enable row level security;
revoke update on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (is_read) on public.notifications to authenticated;

-- App configuration is public read-only. Only backend/service-role or explicit
-- admin database paths should mutate it.
alter table public.app_config enable row level security;
revoke insert, update, delete on public.app_config from anon, authenticated;

notify pgrst, 'reload schema';
