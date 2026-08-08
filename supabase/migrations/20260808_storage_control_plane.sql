-- Storage contract shared by admin-dashboard, frontend-web, and mobile-apk.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','superadmin'))
    or coalesce((auth.jwt()->'app_metadata'->>'role') in ('admin','superadmin'),false);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('category-images','category-images',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('banners','banners',true,8388608,array['image/jpeg','image/png','image/webp']),
  ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
  ('store-photos','store-photos',true,8388608,array['image/jpeg','image/png','image/webp']),
  ('apk','apk',true,209715200,array['application/vnd.android.package-archive','application/octet-stream']),
  ('payment-proofs','payment-proofs',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "admin manage control plane files" on storage.objects;
create policy "admin manage control plane files"
on storage.objects for all to authenticated
using (
  bucket_id in ('product-images','category-images','banners','store-photos','apk')
  and public.is_admin()
)
with check (
  bucket_id in ('product-images','category-images','banners','store-photos','apk')
  and public.is_admin()
);

drop policy if exists "public read control plane files" on storage.objects;
create policy "public read control plane files"
on storage.objects for select to public
using (bucket_id in ('product-images','category-images','banners','avatars','store-photos','apk'));

-- Users can manage only files inside their own avatar folder.
drop policy if exists "users manage own avatar files" on storage.objects;
create policy "users manage own avatar files"
on storage.objects for all to authenticated
using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

-- Customers can upload/read only their own private payment proofs.
drop policy if exists "users manage own payment proofs" on storage.objects;
create policy "users manage own payment proofs"
on storage.objects for all to authenticated
using (bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text)
with check (bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text);
