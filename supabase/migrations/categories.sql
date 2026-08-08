create index if not exists idx_categories_slug on categories(slug);

-- Trigger: sinkronkan product_count otomatis setiap ada produk baru/dihapus.
create or replace function sync_category_product_count() returns trigger as $$
begin
  update categories set product_count = (
    select count(*) from products where category_id = coalesce(new.category_id, old.category_id)
  ) where id = coalesce(new.category_id, old.category_id);
  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_category_count on products;
create trigger trg_sync_category_count
  after insert or delete or update of category_id on products
  for each row execute procedure sync_category_product_count();
