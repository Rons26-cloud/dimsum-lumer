-- This maintenance routine rewrites financial aggregates and has no direct
-- application caller. Keep it available to postgres/service automation only.
begin;

revoke all on function public.refresh_monthly_financial_archive(date)
from public, anon, authenticated;

commit;
