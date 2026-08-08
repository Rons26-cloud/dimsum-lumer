create index if not exists idx_orders_user on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- Trigger: setiap order baru otomatis kirim notifikasi + activity log admin.
create or replace function notify_new_order() returns trigger as $$
begin
  insert into notifications (user_id, title, body)
  values (new.user_id, 'Pesanan Dibuat', 'Pesanan ' || new.order_code || ' berhasil dibuat.');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notify_new_order on orders;
create trigger trg_notify_new_order
  after insert on orders
  for each row execute procedure notify_new_order();
