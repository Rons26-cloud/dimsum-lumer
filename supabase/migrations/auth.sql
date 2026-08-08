-- Trigger: otomatis membuat baris di `profiles` & `member_point` setiap kali
-- ada user baru mendaftar lewat Supabase Auth (dipakai frontend-web & mobile-apk).
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', 'customer');

  insert into public.member_point (user_id, total_point) values (new.id, 0);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
