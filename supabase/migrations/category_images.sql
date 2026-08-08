alter table public.categories
  add column if not exists image_url text,
  add column if not exists icon_url text;

insert into storage.buckets(id,name,public) values ('category-images','category-images',true)
on conflict(id) do update set public=true;

drop policy if exists "public read category images" on storage.objects;
drop policy if exists "admins manage category images" on storage.objects;
create policy "public read category images" on storage.objects for select to public using (bucket_id='category-images');
create policy "admins manage category images" on storage.objects for all to authenticated
using (bucket_id='category-images' and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','superadmin')))
with check (bucket_id='category-images' and exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','superadmin')));

do $$ begin alter publication supabase_realtime add table public.categories; exception when duplicate_object then null; end $$;
notify pgrst, 'reload schema';
