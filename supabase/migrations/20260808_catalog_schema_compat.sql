-- Align legacy Indonesian catalog columns with the shared Web/Admin/APK contract.
alter table public.products
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists price numeric(12,2),
  add column if not exists image_url text,
  add column if not exists category_id uuid references public.categories(id) on delete set null,
  add column if not exists stock integer default 0,
  add column if not exists is_active boolean default true,
  add column if not exists slug text,
  add column if not exists sold_count integer default 0;

update public.products set
  name=coalesce(name,nama,'Produk'), description=coalesce(description,deskripsi),
  price=coalesce(price,harga,0), image_url=coalesce(image_url,image,gambar),
  category_id=coalesce(category_id,kategori_id),
  is_active=coalesce(is_active,status is distinct from 'nonaktif')
where name is null or price is null or image_url is null;

alter table public.categories
  add column if not exists name text,
  add column if not exists image_url text,
  add column if not exists icon_url text;
update public.categories set name=coalesce(name,nama,'Kategori'), image_url=coalesce(image_url,icon_url,icon);

alter table public.flash_sales
  add column if not exists product_id uuid references public.products(id) on delete cascade,
  add column if not exists sale_price numeric(12,2) default 0,
  add column if not exists original_price numeric(12,2) default 0,
  add column if not exists flash_stock integer default 0,
  add column if not exists starts_at timestamptz default now(),
  add column if not exists ends_at timestamptz default (now() + interval '1 day'),
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

notify pgrst, 'reload schema';
