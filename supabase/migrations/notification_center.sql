alter table public.notifications
  add column if not exists type text default 'system',
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.profiles
  add column if not exists notification_permission text default 'default';

create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_type on public.notifications(user_id, type);

alter table public.notifications enable row level security;
drop policy if exists "users read own notifications" on public.notifications;
drop policy if exists "users update own notifications" on public.notifications;
drop policy if exists "users delete own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "users update own notifications" on public.notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own notifications" on public.notifications for delete to authenticated using (auth.uid() = user_id);

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
