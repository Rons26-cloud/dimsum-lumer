begin;
-- DDL membutuhkan ACCESS EXCLUSIVE lock. Beri waktu untuk transaksi web/realtime
-- yang singkat selesai, tetapi jangan menunggu tanpa batas.
set local lock_timeout = '30s';
set local statement_timeout = '2min';
set local statement_timeout = '60s';

alter table public.addresses
  add column if not exists province text,
  add column if not exists regency text,
  add column if not exists district text,
  add column if not exists village text,
  add column if not exists whatsapp text;

update public.addresses
set whatsapp = coalesce(nullif(trim(whatsapp), ''), nullif(trim(phone_number), ''), nullif(trim(phone), ''))
where whatsapp is null or trim(whatsapp) = '';

comment on column public.addresses.province is 'Provinsi hasil pilihan/reverse geocoding alamat pengguna.';
comment on column public.addresses.regency is 'Kabupaten atau kota alamat pengguna.';
comment on column public.addresses.district is 'Kecamatan alamat pengguna.';
comment on column public.addresses.village is 'Desa atau kelurahan alamat pengguna.';
comment on column public.addresses.whatsapp is 'Nomor WhatsApp penerima untuk kebutuhan pengiriman.';

commit;
