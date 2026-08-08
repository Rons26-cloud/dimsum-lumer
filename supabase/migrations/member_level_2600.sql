-- Member level v2: setiap level berjarak 2.600 koin dan setiap order selesai mendapat 2 koin.
alter table public.orders
  add column if not exists earned_point integer default 0,
  add column if not exists point_given boolean default false,
  add column if not exists is_flash_sale boolean default false;

alter table public.point_history
  add column if not exists point integer,
  add column if not exists amount integer;

create or replace function public.update_member_level()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.point := greatest(coalesce(new.point, 0), 0);
  new.member_level := case
    when new.point >= 7800 then 'Platinum'
    when new.point >= 5200 then 'Gold'
    when new.point >= 2600 then 'Silver'
    else 'Bronze'
  end;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trigger_update_member_level on public.profiles;
create trigger trigger_update_member_level
before insert or update of point on public.profiles
for each row execute function public.update_member_level();

drop trigger if exists trg_apply_point on public.orders;
drop trigger if exists trigger_add_order_point on public.orders;

create or replace function public.award_completed_order_coins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed'
     and old.status is distinct from 'completed'
     and new.user_id is not null
     and coalesce(new.point_given, false) = false
     and coalesce(new.is_flash_sale, false) = false then
    update public.profiles
       set point = coalesce(point, 0) + 2
     where id = new.user_id;

    insert into public.point_history(user_id, order_id, point, amount, type, description)
    values(new.user_id, new.id, 2, 2, 'earn', '2 koin dari pesanan selesai');

    update public.orders
       set earned_point = 2,
           point_given = true
     where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_award_completed_order_coins on public.orders;
create trigger trigger_award_completed_order_coins
after update of status on public.orders
for each row execute function public.award_completed_order_coins();

update public.profiles
set point = coalesce(point, 0);

do $$
begin
  alter publication supabase_realtime add table public.point_history;
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
