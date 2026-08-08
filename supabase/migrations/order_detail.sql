create index if not exists idx_order_detail_order on order_detail(order_id);

-- Trigger: setiap produk dibeli, tambahkan ke sold_count & kurangi stock.
create or replace function apply_order_detail_effect() returns trigger as $$
begin
  update products
  set sold_count = sold_count + new.qty,
      stock = greatest(stock - new.qty, 0)
  where id = new.product_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_apply_order_detail on order_detail;
create trigger trg_apply_order_detail
  after insert on order_detail
  for each row execute procedure apply_order_detail_effect();
