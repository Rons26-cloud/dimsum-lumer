-- Lokasi resmi Dimsum Lumer di Hongkong Fashion, Medan Amplas.
update public.stores
set name = 'Dimsum Lumer - Hongkong Fashion',
    address = 'Hongkong Fashion, Jalan Sisingamangaraja, Sudirejo II, Medan Amplas, Kota Medan, Sumatera Utara 20147',
    latitude = 3.570776,
    longitude = 98.694665,
    phone = '6288807597952',
    open_time = '10:00',
    close_time = '22:00',
    is_open = true;

insert into public.stores(name, address, latitude, longitude, phone, open_time, close_time, is_open)
select 'Dimsum Lumer - Hongkong Fashion',
       'Hongkong Fashion, Jalan Sisingamangaraja, Sudirejo II, Medan Amplas, Kota Medan, Sumatera Utara 20147',
       3.570776, 98.694665, '6288807597952', '10:00', '22:00', true
where not exists (select 1 from public.stores);

notify pgrst, 'reload schema';
