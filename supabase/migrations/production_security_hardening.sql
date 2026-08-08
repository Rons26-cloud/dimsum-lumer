-- Security hardening: transaksi hanya boleh dibuat melalui RPC tervalidasi.
drop policy if exists "own orders insert" on public.orders;
drop policy if exists "own order_detail insert" on public.order_detail;

-- Admin check dengan search_path tetap untuk mencegah object shadowing.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','superadmin')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Bukti pembayaran hanya boleh disimpan pada folder pesanan milik user.
drop policy if exists "users upload own payment proofs" on storage.objects;
create policy "users upload own payment proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
  and array_length(storage.foldername(name), 1) >= 2
  and exists (
    select 1 from public.orders o
    where o.id::text = (storage.foldername(name))[2]
      and o.user_id = auth.uid()
      and o.status = 'pending'
      and coalesce(o.payment_status, 'unpaid') in ('unpaid','failed')
  )
  and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','pdf')
);

create or replace function public.submit_payment_proof(p_order_id uuid,p_proof_path text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parts text[] := string_to_array(p_proof_path, '/');
  v_ext text := lower(split_part(p_proof_path, '.', array_length(string_to_array(p_proof_path, '.'),1)));
begin
  if auth.uid() is null then raise exception 'Pengguna belum login'; end if;
  if array_length(v_parts,1) <> 3
     or v_parts[1] <> auth.uid()::text
     or v_parts[2] <> p_order_id::text
     or v_ext not in ('jpg','jpeg','png','webp','pdf') then
    raise exception 'Path bukti pembayaran tidak valid';
  end if;
  update public.orders
    set payment_proof_url=p_proof_path,
        payment_status='waiting_verification',
        paid_at=now(),
        updated_at=now()
  where id=p_order_id
    and user_id=auth.uid()
    and status='pending'
    and coalesce(payment_status,'unpaid') in ('unpaid','failed');
  if not found then raise exception 'Pesanan tidak ditemukan atau tidak dapat dibayar'; end if;
end;
$$;

revoke all on function public.submit_payment_proof(uuid,text) from public;
grant execute on function public.submit_payment_proof(uuid,text) to authenticated;

-- Batasi nilai status walaupun request berasal dari dashboard/admin.
do $$ begin
  alter table public.orders add constraint orders_status_allowed
    check (status in ('pending','processing','shipping','completed','cancelled')) not valid;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
