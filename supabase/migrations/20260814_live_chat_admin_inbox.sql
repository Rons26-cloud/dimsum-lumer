-- Status inbox, balasan, dan arsip live chat admin.
set local lock_timeout = '30s';
set local statement_timeout = '2min';

alter table public.live_chat_conversations
  add column if not exists admin_read_at timestamptz,
  add column if not exists admin_replied_at timestamptz,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references auth.users(id) on delete set null;

create index if not exists live_chat_admin_inbox_idx
  on public.live_chat_conversations(status, admin_read_at, admin_replied_at, last_message_at desc);

comment on column public.live_chat_conversations.admin_read_at is 'Terisi saat admin membuka detail percakapan terbaru.';
comment on column public.live_chat_conversations.admin_replied_at is 'Dikosongkan saat pesan customer baru masuk dan terisi setelah admin membalas.';
comment on column public.live_chat_conversations.resolved_at is 'Waktu percakapan dipindahkan ke arsip.';
