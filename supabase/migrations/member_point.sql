-- Trigger: order selesai (status -> completed) otomatis menambah poin member
-- (1 poin per Rp10.000 belanja) dan mencatat ke point_history.
create or replace function apply_point_on_completed() returns trigger as $$
declare
  earned int;
begin
  if new.status = 'completed' and old.status is distinct from 'completed' and new.user_id is not null then
    earned := floor(new.total / 10000);

    insert into member_point (user_id, total_point)
    values (new.user_id, earned)
    on conflict (user_id) do update set total_point = member_point.total_point + earned, updated_at = now();

    insert into point_history (user_id, order_id, type, amount, description)
    values (new.user_id, new.id, 'earn', earned, 'Poin dari pesanan ' || new.order_code);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_apply_point on orders;
create trigger trg_apply_point
  after update of status on orders
  for each row execute procedure apply_point_on_completed();
