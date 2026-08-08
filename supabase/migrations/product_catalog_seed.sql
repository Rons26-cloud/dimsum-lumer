-- Katalog produk awal. Nama diselaraskan dengan resolver aset frontend.
insert into public.products(id,name,description,price,stock)
values
  ('10000000-0000-4000-8000-000000000001'::uuid,'Dimsum Ayam Original','Dimsum ayam juicy dengan kulit tipis, isi 4.',20000::numeric,100),
  ('10000000-0000-4000-8000-000000000002'::uuid,'Dimsum Udang','Dimsum dengan isian udang segar pilihan.',20000::numeric,100),
  ('10000000-0000-4000-8000-000000000003'::uuid,'Dimsum Mozarella','Dimsum ayam dengan keju mozarella lumer.',18000::numeric,100),
  ('10000000-0000-4000-8000-000000000004'::uuid,'Pangsit Goreng Lumer','Pangsit ayam udang renyah dengan saus spesial, isi 4.',18000::numeric,100),
  ('10000000-0000-4000-8000-000000000005'::uuid,'Dimsum Pedas','Dimsum ayam dengan saus cabai pedas spesial.',20000::numeric,100),
  ('10000000-0000-4000-8000-000000000006'::uuid,'Dimsum Keju','Dimsum gurih dengan saus dan parutan keju.',20000::numeric,100),
  ('10000000-0000-4000-8000-000000000007'::uuid,'Dimsum BBQ','Dimsum dengan saus BBQ manis dan smoky.',22000::numeric,100),
  ('10000000-0000-4000-8000-000000000008'::uuid,'Dimsum Mix','Kombinasi berbagai varian dimsum favorit.',22000::numeric,100),
  ('10000000-0000-4000-8000-000000000009'::uuid,'Dimsum Jagung','Dimsum ayam dengan topping jagung manis.',20000::numeric,100),
  ('10000000-0000-4000-8000-000000000010'::uuid,'Dimsum Jamur','Dimsum ayam dengan jamur gurih pilihan.',20000::numeric,100),
  ('10000000-0000-4000-8000-000000000011'::uuid,'Dimsum Sosis','Dimsum ayam dengan topping sosis panggang.',20000::numeric,100),
  ('10000000-0000-4000-8000-000000000012'::uuid,'Dimsum Ayam Premium','Dimsum berisi ayam premium yang padat dan juicy.',25000::numeric,100)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  stock = greatest(public.products.stock, excluded.stock),
  is_active = true;

notify pgrst, 'reload schema';
