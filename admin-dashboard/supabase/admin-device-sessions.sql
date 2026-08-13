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
drop policy if exists "admin read own device sessions" on public.admin_sessions;
drop policy if exists "admin create own device sessions" on public.admin_sessions;
drop policy if exists "admin update own device sessions" on public.admin_sessions;
drop policy if exists "admin delete own device sessions" on public.admin_sessions;
create policy "admin read own device sessions" on public.admin_sessions
  for select to authenticated
  using (admin_id = auth.uid() and public.is_admin() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2');
create policy "admin create own device sessions" on public.admin_sessions
  for insert to authenticated
  with check (admin_id = auth.uid() and public.is_admin() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2');
create policy "admin update own device sessions" on public.admin_sessions
  for update to authenticated
  using (admin_id = auth.uid() and public.is_admin() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2')
  with check (admin_id = auth.uid() and public.is_admin() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2');
create policy "admin delete own device sessions" on public.admin_sessions
  for delete to authenticated
  using (admin_id = auth.uid() and public.is_admin() and coalesce(auth.jwt() ->> 'aal', '') = 'aal2');
revoke all on public.admin_sessions from anon;
revoke all on public.admin_sessions from authenticated;
grant select, insert, update, delete on public.admin_sessions to authenticated;
create index if not exists admin_sessions_last_seen_idx on public.admin_sessions(admin_id,last_seen_at desc);
create index if not exists admin_sessions_active_idx on public.admin_sessions(admin_id, ended_at, last_seen_at desc);
do $$ begin
  alter publication supabase_realtime add table public.admin_sessions;
exception when duplicate_object then null;
end $$;
notify pgrst, 'reload schema';
