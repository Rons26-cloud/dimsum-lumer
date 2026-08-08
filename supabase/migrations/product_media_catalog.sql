alter table public.products
  add column if not exists slug text,
  add column if not exists rating numeric(2,1) default 4.8,
  add column if not exists frozen_price numeric(12,2) default 55000;

update public.products
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null or trim(slug) = '';

create unique index if not exists products_slug_unique
on public.products(slug) where slug is not null;

notify pgrst, 'reload schema';
