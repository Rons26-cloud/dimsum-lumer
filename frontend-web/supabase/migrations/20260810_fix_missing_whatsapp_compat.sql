-- Kompatibilitas schema lama: beberapa function/trigger masih membaca
-- `whatsapp`, sedangkan aplikasi terbaru memakai `phone`.
-- Migration ini tidak menghapus atau menimpa nomor yang sudah tersimpan.

alter table public.profiles
  add column if not exists whatsapp text;

alter table public.stores
  add column if not exists whatsapp text;

update public.profiles
set
  phone = coalesce(nullif(trim(phone), ''), nullif(trim(whatsapp), '')),
  whatsapp = coalesce(nullif(trim(whatsapp), ''), nullif(trim(phone), ''))
where phone is null
   or trim(phone) = ''
   or whatsapp is null
   or trim(whatsapp) = '';

update public.stores
set
  phone = coalesce(nullif(trim(phone), ''), nullif(trim(whatsapp), '')),
  whatsapp = coalesce(nullif(trim(whatsapp), ''), nullif(trim(phone), ''))
where phone is null
   or trim(phone) = ''
   or whatsapp is null
   or trim(whatsapp) = '';

create or replace function public.sync_phone_whatsapp_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.phone := coalesce(nullif(trim(new.phone), ''), nullif(trim(new.whatsapp), ''));
    new.whatsapp := coalesce(nullif(trim(new.whatsapp), ''), nullif(trim(new.phone), ''));
  elsif new.phone is distinct from old.phone then
    new.whatsapp := new.phone;
  elsif new.whatsapp is distinct from old.whatsapp then
    new.phone := new.whatsapp;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_sync_phone_whatsapp on public.profiles;
create trigger trg_profiles_sync_phone_whatsapp
before insert or update of phone, whatsapp on public.profiles
for each row execute function public.sync_phone_whatsapp_columns();

drop trigger if exists trg_stores_sync_phone_whatsapp on public.stores;
create trigger trg_stores_sync_phone_whatsapp
before insert or update of phone, whatsapp on public.stores
for each row execute function public.sync_phone_whatsapp_columns();

notify pgrst, 'reload schema';
