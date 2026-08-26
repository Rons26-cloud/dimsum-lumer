-- Trigger/event-trigger functions are implementation details, not public RPCs.
-- Revoking EXECUTE does not stop already-created triggers from invoking them.
begin;

revoke all on function public.award_completed_order_coins() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.notify_admins_new_order() from public, anon, authenticated;
revoke all on function public.notify_low_stock() from public, anon, authenticated;
revoke all on function public.notify_order_status_change() from public, anon, authenticated;
revoke all on function public.prepare_order_status_change() from public, anon, authenticated;
revoke all on function public.protect_user_payment_method() from public, anon, authenticated;
revoke all on function public.record_order_status_history() from public, anon, authenticated;
revoke all on function public.refresh_financial_archive_trigger() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.snapshot_order_item_cost() from public, anon, authenticated;
revoke all on function public.sync_order_payment_status() from public, anon, authenticated;
revoke all on function public.sync_primary_store_config() from public, anon, authenticated;
revoke all on function public.sync_product_rating() from public, anon, authenticated;
revoke all on function public.sync_product_recommendation_sales() from public, anon, authenticated;

-- Obsolete/internal helpers have no application caller and must not be exposed.
revoke all on function public.notify_new_order() from public, anon, authenticated;
revoke all on function public.recalculate_product_rating(uuid) from public, anon, authenticated;

-- Administrator RPCs remain available only to signed-in users. Their bodies
-- perform the authoritative admin + AAL2 checks before privileged access.
revoke all on function public.admin_get_customer_account(uuid) from public, anon;
revoke all on function public.admin_set_customer_suspension(uuid, boolean, text) from public, anon;
grant execute on function public.admin_get_customer_account(uuid) to authenticated;
grant execute on function public.admin_set_customer_suspension(uuid, boolean, text) to authenticated;

commit;
