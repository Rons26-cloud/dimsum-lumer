alter table public.stores
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists open_time time default '10:00',
  add column if not exists close_time time default '22:00',
  add column if not exists is_open boolean default true;

update public.stores
set name='Dimsum Lumer - Hongkong Fashion',
    address='Hongkong Fashion, Jalan Sisingamangaraja, Sudirejo II, Medan Amplas, Kota Medan, Sumatera Utara 20147',
    latitude=3.570776,
    longitude=98.694665,
    phone='6288807597952',
    open_time='10:00', close_time='22:00', is_open=true;

notify pgrst, 'reload schema';
