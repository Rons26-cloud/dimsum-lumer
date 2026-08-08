alter table public.profiles
  add column if not exists birthday date,
  add column if not exists gender text check (gender is null or gender in ('male','female','other')),
  add column if not exists avatar_url text;

alter table public.profiles enable row level security;
drop policy if exists "users read own profile" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "users insert own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

insert into storage.buckets(id,name,public) values ('avatars','avatars',true) on conflict(id) do update set public=true;
drop policy if exists "users upload own avatar" on storage.objects;
drop policy if exists "public read avatars" on storage.objects;
create policy "users upload own avatar" on storage.objects for all to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "public read avatars" on storage.objects for select to public using (bucket_id='avatars');

do $$ begin alter publication supabase_realtime add table public.profiles; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.orders; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.member_point; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.reward; exception when duplicate_object then null; end $$;
do $$ begin
  if to_regclass('public.rewards') is not null then alter publication supabase_realtime add table public.rewards; end if;
exception when duplicate_object then null;
end $$;
do $$ begin alter publication supabase_realtime add table public.wishlist; exception when duplicate_object then null; end $$;
notify pgrst, 'reload schema';
