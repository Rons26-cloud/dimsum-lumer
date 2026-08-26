create table if not exists public.merchant_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  method_code text not null,
  account_type text not null check (account_type in ('bank', 'ewallet', 'qris', 'cod')),
  provider_name text not null check (char_length(trim(provider_name)) between 2 and 60),
  account_name text,
  account_number text,
  qr_image_url text,
  instructions text,
  is_active boolean not null default true,
  is_primary boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchant_payment_accounts_method_code_format
    check (method_code ~ '^[a-z0-9][a-z0-9_-]{1,39}$'),
  constraint merchant_payment_accounts_details
    check (
      account_type = 'cod'
      or (account_type = 'qris' and qr_image_url ~ '^https://')
      or (account_type in ('bank', 'ewallet') and char_length(regexp_replace(coalesce(account_number, ''), '[^0-9]', '', 'g')) between 6 and 34)
    ),
  constraint merchant_payment_accounts_https_qr
    check (qr_image_url is null or qr_image_url ~ '^https://')
);

create unique index if not exists merchant_payment_accounts_method_code_key
  on public.merchant_payment_accounts (lower(method_code));
create index if not exists merchant_payment_accounts_public_order_idx
  on public.merchant_payment_accounts (is_active, sort_order, created_at);

alter table public.merchant_payment_accounts enable row level security;
revoke all on table public.merchant_payment_accounts from public, anon;
grant select, insert, update, delete on table public.merchant_payment_accounts to authenticated;

create policy "admin aal2 reads merchant payment accounts"
on public.merchant_payment_accounts for select to authenticated
using (public.is_admin_aal2());

create policy "admin aal2 creates merchant payment accounts"
on public.merchant_payment_accounts for insert to authenticated
with check (public.is_admin_aal2());

create policy "admin aal2 updates merchant payment accounts"
on public.merchant_payment_accounts for update to authenticated
using (public.is_admin_aal2()) with check (public.is_admin_aal2());

create policy "admin aal2 deletes merchant payment accounts"
on public.merchant_payment_accounts for delete to authenticated
using (public.is_admin_aal2());

create or replace function public.set_merchant_payment_account_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.method_code := lower(trim(new.method_code));
  new.provider_name := trim(new.provider_name);
  new.account_name := nullif(trim(coalesce(new.account_name, '')), '');
  new.account_number := nullif(regexp_replace(coalesce(new.account_number, ''), '[^0-9]', '', 'g'), '');
  new.qr_image_url := nullif(trim(coalesce(new.qr_image_url, '')), '');
  new.instructions := nullif(trim(coalesce(new.instructions, '')), '');
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_merchant_payment_account_updated_at() from public, anon, authenticated;
drop trigger if exists set_merchant_payment_account_updated_at on public.merchant_payment_accounts;
create trigger set_merchant_payment_account_updated_at
before insert or update on public.merchant_payment_accounts
for each row execute function public.set_merchant_payment_account_updated_at();

create or replace function public.get_merchant_payment_accounts()
returns table (
  id uuid, method_code text, account_type text, provider_name text,
  account_name text, account_number text, qr_image_url text,
  instructions text, is_primary boolean, sort_order integer
)
language sql stable security definer set search_path = public as $$
  select a.id, a.method_code, a.account_type, a.provider_name,
         a.account_name, a.account_number, a.qr_image_url,
         a.instructions, a.is_primary, a.sort_order
  from public.merchant_payment_accounts a
  where a.is_active
  order by a.sort_order, a.is_primary desc, a.created_at;
$$;

revoke all on function public.get_merchant_payment_accounts() from public;
grant execute on function public.get_merchant_payment_accounts() to anon, authenticated;

do $$
begin
  if to_regprocedure('public.capture_admin_audit()') is not null then
    execute 'create trigger audit_merchant_payment_accounts after insert or update or delete on public.merchant_payment_accounts for each row execute function public.capture_admin_audit()';
  end if;
end $$;
