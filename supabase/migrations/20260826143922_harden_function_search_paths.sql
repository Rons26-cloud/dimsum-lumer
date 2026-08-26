-- Resolve built-ins from pg_catalog first and project objects explicitly from
-- public. pg_temp remains last so temporary objects cannot shadow either.
begin;

alter function public.redeem_user_point() set search_path = pg_catalog, public, pg_temp;
alter function public.sync_order_detail_legacy_cols() set search_path = pg_catalog, public, pg_temp;
alter function public.sync_flash_sales_stock() set search_path = pg_catalog, public, pg_temp;
alter function public.sync_flash_sales_stock_insert() set search_path = pg_catalog, public, pg_temp;
alter function public.add_order_point() set search_path = pg_catalog, public, pg_temp;
alter function public.guard_store_open() set search_path = pg_catalog, public, pg_temp;
alter function public.touch_app_config() set search_path = pg_catalog, public, pg_temp;

-- Trigger functions are not application RPC endpoints.
revoke all on function public.redeem_user_point() from public, anon, authenticated;
revoke all on function public.sync_order_detail_legacy_cols() from public, anon, authenticated;
revoke all on function public.sync_flash_sales_stock() from public, anon, authenticated;
revoke all on function public.sync_flash_sales_stock_insert() from public, anon, authenticated;
revoke all on function public.guard_store_open() from public, anon, authenticated;
revoke all on function public.touch_app_config() from public, anon, authenticated;

-- No application or trigger references this legacy helper.
revoke all on function public.add_order_point() from public, anon, authenticated;

commit;
