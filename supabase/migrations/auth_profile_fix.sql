create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, user_id, full_name, phone, role, point, member_level)
  values(new.id,new.id,coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),new.raw_user_meta_data->>'phone','user',0,'Bronze')
  on conflict(id) do update set user_id=excluded.user_id, full_name=coalesce(excluded.full_name,public.profiles.full_name), phone=coalesce(excluded.phone,public.profiles.phone), updated_at=now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
notify pgrst, 'reload schema';
