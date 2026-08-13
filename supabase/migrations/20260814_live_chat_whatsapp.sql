-- Live chat pengguna, inbox admin realtime, dan status penerusan WhatsApp.
set local lock_timeout = '30s';
set local statement_timeout = '2min';

create table if not exists public.live_chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'open' check (status in ('open','resolved')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists live_chat_one_open_per_user
  on public.live_chat_conversations(user_id) where status='open';

create table if not exists public.live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.live_chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','admin')),
  message text not null check (char_length(trim(message)) between 1 and 1000),
  is_read boolean not null default false,
  whatsapp_status text not null default 'not_requested' check (whatsapp_status in ('not_requested','sent','failed','not_configured')),
  created_at timestamptz not null default now()
);

create index if not exists live_chat_messages_conversation_created_idx on public.live_chat_messages(conversation_id,created_at);
create index if not exists live_chat_conversations_last_message_idx on public.live_chat_conversations(last_message_at desc);

alter table public.live_chat_conversations enable row level security;
alter table public.live_chat_messages enable row level security;

drop policy if exists "customer read own chat conversations" on public.live_chat_conversations;
create policy "customer read own chat conversations" on public.live_chat_conversations for select to authenticated using (user_id=auth.uid());
drop policy if exists "admin aal2 manage chat conversations" on public.live_chat_conversations;
create policy "admin aal2 manage chat conversations" on public.live_chat_conversations for all to authenticated using (public.is_admin_aal2()) with check (public.is_admin_aal2());

drop policy if exists "customer read own chat messages" on public.live_chat_messages;
create policy "customer read own chat messages" on public.live_chat_messages for select to authenticated using (user_id=auth.uid());
drop policy if exists "admin aal2 manage chat messages" on public.live_chat_messages;
create policy "admin aal2 manage chat messages" on public.live_chat_messages for all to authenticated using (public.is_admin_aal2()) with check (public.is_admin_aal2());

do $$ begin
  alter publication supabase_realtime add table public.live_chat_conversations;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.live_chat_messages;
exception when duplicate_object then null; end $$;

grant select on public.live_chat_conversations, public.live_chat_messages to authenticated;
grant insert,update on public.live_chat_conversations, public.live_chat_messages to authenticated;

comment on table public.live_chat_messages is 'Pesan live chat; pesan customer dibuat melalui Edge Function dan dapat diteruskan ke WhatsApp admin.';
