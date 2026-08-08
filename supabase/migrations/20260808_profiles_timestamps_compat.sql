alter table public.profiles
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.profiles set created_at = now() where created_at is null;
update public.profiles set updated_at = now() where updated_at is null;

alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column updated_at set default now();
notify pgrst, 'reload schema';
