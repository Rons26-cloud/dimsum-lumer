create index if not exists idx_reviews_product on reviews(product_id);

-- Trigger: rata-rata rating produk otomatis update setiap ada review baru.
create or replace function sync_product_rating() returns trigger as $$
begin
  update products set rating = (
    select coalesce(round(avg(rating)::numeric, 1), 0) from reviews where product_id = new.product_id
  ) where id = new.product_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_product_rating on reviews;
create trigger trg_sync_product_rating
  after insert or update of rating on reviews
  for each row execute procedure sync_product_rating();
