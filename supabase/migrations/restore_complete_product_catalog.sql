-- Memulihkan katalog produksi dengan UUID stabil yang sama untuk Web dan APK.
alter table public.products
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists price numeric default 0,
  add column if not exists image text,
  add column if not exists image_url text,
  add column if not exists stock integer default 100,
  add column if not exists is_active boolean default true,
  add column if not exists sold_count integer default 0,
  add column if not exists rating numeric(2,1) default 4.8,
  add column if not exists frozen_price numeric(12,2) default 55000,
  add column if not exists updated_at timestamptz default now();

insert into public.products(id,slug,name,description,price,image,image_url,stock,is_active,sold_count,rating,updated_at)
values
('10000000-0000-4000-8000-000000000001','dimsum-ayam-original','Dimsum Ayam Original','Dimsum ayam juicy dengan kulit tipis, isi 4.',20000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/original.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/original.jpg',100,true,0,4.8,now()),
('10000000-0000-4000-8000-000000000002','dimsum-udang','Dimsum Udang','Dimsum dengan isian udang segar pilihan.',20000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/udang.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/udang.jpg',100,true,0,4.9,now()),
('10000000-0000-4000-8000-000000000003','dimsum-mozarella','Dimsum Mozarella','Dimsum ayam dengan keju mozarella lumer.',18000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/mozarella.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/mozarella.jpg',100,true,0,4.9,now()),
('10000000-0000-4000-8000-000000000004','pangsit-goreng-lumer','Pangsit Goreng Lumer','Pangsit ayam udang renyah dengan saus spesial.',18000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/pangsit-goreng-lumer.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/pangsit-goreng-lumer.jpg',100,true,0,4.7,now()),
('10000000-0000-4000-8000-000000000005','dimsum-pedas','Dimsum Pedas','Dimsum ayam dengan saus cabai pedas spesial.',20000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/pedas.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/pedas.jpg',100,true,0,4.8,now()),
('10000000-0000-4000-8000-000000000006','dimsum-keju','Dimsum Keju','Dimsum gurih dengan saus dan parutan keju.',20000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/keju.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/keju.jpg',100,true,0,4.8,now()),
('10000000-0000-4000-8000-000000000007','dimsum-bbq','Dimsum BBQ','Dimsum dengan saus BBQ manis dan smoky.',22000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/bbq.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/bbq.jpg',100,true,0,4.8,now()),
('10000000-0000-4000-8000-000000000008','dimsum-mix','Dimsum Mix','Kombinasi berbagai varian dimsum favorit.',22000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/mix.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/mix.jpg',100,true,0,4.9,now()),
('10000000-0000-4000-8000-000000000009','dimsum-jagung','Dimsum Jagung','Dimsum ayam dengan topping jagung manis.',20000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/jagung.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/jagung.jpg',100,true,0,4.7,now()),
('10000000-0000-4000-8000-000000000010','dimsum-jamur','Dimsum Jamur','Dimsum ayam dengan jamur gurih pilihan.',20000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/jamur.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/jamur.jpg',100,true,0,4.7,now()),
('10000000-0000-4000-8000-000000000011','dimsum-sosis','Dimsum Sosis','Dimsum ayam dengan topping sosis panggang.',20000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/sosis.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/sosis.jpg',100,true,0,4.7,now()),
('10000000-0000-4000-8000-000000000012','dimsum-ayam-premium','Dimsum Ayam Premium','Dimsum berisi ayam premium yang padat dan juicy.',25000,'https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/ayampremium.jpg','https://uwrrfvinmhhgmotjgrng.supabase.co/storage/v1/object/public/product-images/catalog/ayampremium.jpg',100,true,0,4.9,now())
on conflict(id) do update set
  slug=excluded.slug,name=excluded.name,description=excluded.description,
  price=excluded.price,image=excluded.image,image_url=excluded.image_url,
  is_active=true,rating=excluded.rating,updated_at=now();

create unique index if not exists products_slug_unique
on public.products(slug) where slug is not null;

do $$ begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
