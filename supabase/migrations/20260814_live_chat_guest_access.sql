-- Identitas tamu untuk live chat tanpa halaman login.
set local lock_timeout = '30s';
set local statement_timeout = '2min';

alter table public.live_chat_conversations
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists is_guest boolean not null default false;

alter table public.live_chat_conversations
  drop constraint if exists live_chat_customer_name_length;
alter table public.live_chat_conversations
  add constraint live_chat_customer_name_length check(customer_name is null or char_length(trim(customer_name)) between 2 and 100);
alter table public.live_chat_conversations
  drop constraint if exists live_chat_customer_phone_format;
alter table public.live_chat_conversations
  add constraint live_chat_customer_phone_format check(customer_phone is null or customer_phone ~ '^62[0-9]{8,15}$');

comment on column public.live_chat_conversations.is_guest is 'True untuk sesi Supabase anonim; pengguna tidak perlu melalui halaman login.';
