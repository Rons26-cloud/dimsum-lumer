alter table public.orders add column if not exists payment_status text default 'unpaid';
alter table public.orders add column if not exists payment_proof_url text;
alter table public.orders add column if not exists paid_at timestamptz;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('payment-proofs','payment-proofs',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "users upload own payment proofs" on storage.objects;
create policy "users upload own payment proofs" on storage.objects for insert to authenticated
with check (bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "users read own payment proofs" on storage.objects;
create policy "users read own payment proofs" on storage.objects for select to authenticated
using (bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text);

create or replace function public.submit_payment_proof(p_order_id uuid,p_proof_path text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Pengguna belum login'; end if;
  if p_proof_path is null or split_part(p_proof_path,'/',1)<>auth.uid()::text then raise exception 'Path bukti tidak valid'; end if;
  update public.orders set payment_proof_url=p_proof_path,payment_status='waiting_verification',paid_at=now(),updated_at=now()
  where id=p_order_id and user_id=auth.uid() and status='pending';
  if not found then raise exception 'Pesanan tidak ditemukan atau tidak dapat dibayar'; end if;
end;$$;
revoke all on function public.submit_payment_proof(uuid,text) from public;
grant execute on function public.submit_payment_proof(uuid,text) to authenticated;

notify pgrst, 'reload schema';
