-- Jalankan sekali di Supabase SQL Editor untuk mengaktifkan daftar perangkat admin.
create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  device_type text not null default 'desktop',
  device_name text,
  browser text,
  operating_system text,
  timezone text,
  locale text,
  screen_size text,
  user_agent text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  unique(admin_id, device_id)
);
alter table public.admin_sessions enable row level security;
drop policy if exists "admin manage own device sessions" on public.admin_sessions;
create policy "admin manage own device sessions" on public.admin_sessions for all to authenticated
  using (admin_id=auth.uid() and public.is_admin())
  with check (admin_id=auth.uid() and public.is_admin());
create index if not exists admin_sessions_last_seen_idx on public.admin_sessions(admin_id,last_seen_at desc);
do $$ begin
  alter publication supabase_realtime add table public.admin_sessions;
exception when duplicate_object then null;
end $$;
notify pgrst, 'reload schema';
