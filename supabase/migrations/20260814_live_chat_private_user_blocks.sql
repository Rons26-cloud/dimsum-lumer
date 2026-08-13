-- Final authority: setiap pelanggan hanya dapat membaca blok chat miliknya.
set local lock_timeout = '30s';
set local statement_timeout = '2min';

alter table public.live_chat_conversations enable row level security;
alter table public.live_chat_messages enable row level security;

revoke all on public.live_chat_conversations from public, anon;
revoke all on public.live_chat_messages from public, anon;
revoke insert, update, delete on public.live_chat_conversations from authenticated;
revoke insert, update, delete on public.live_chat_messages from authenticated;
grant select on public.live_chat_conversations, public.live_chat_messages to authenticated;

drop policy if exists "customer read own chat conversations" on public.live_chat_conversations;
create policy "customer read own chat conversations"
on public.live_chat_conversations
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "customer read own chat messages" on public.live_chat_messages;
create policy "customer read own chat messages"
on public.live_chat_messages
for select to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.live_chat_conversations conversation
    where conversation.id = live_chat_messages.conversation_id
      and conversation.user_id = auth.uid()
  )
);

drop policy if exists "admin aal2 manage chat conversations" on public.live_chat_conversations;
create policy "admin aal2 manage chat conversations"
on public.live_chat_conversations
for all to authenticated
using (public.is_admin_aal2())
with check (public.is_admin_aal2());

drop policy if exists "admin aal2 manage chat messages" on public.live_chat_messages;
create policy "admin aal2 manage chat messages"
on public.live_chat_messages
for all to authenticated
using (public.is_admin_aal2())
with check (public.is_admin_aal2());

-- Admin dashboard tetap membutuhkan privilege SQL; policy AAL2 di atas yang
-- menentukan admin mana yang boleh membaca/menulis seluruh blok pelanggan.
grant insert, update on public.live_chat_conversations, public.live_chat_messages to authenticated;

comment on table public.live_chat_conversations is
  'Blok percakapan privat per pelanggan. Pelanggan hanya melihat user_id sendiri; admin AAL2 melihat seluruh inbox.';
