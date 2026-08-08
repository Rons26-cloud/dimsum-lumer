alter table public.cart_items replica identity full;

do $$ begin
  alter publication supabase_realtime add table public.cart_items;
exception when duplicate_object then null;
end $$;

create index if not exists cart_items_user_id_realtime_idx
on public.cart_items(user_id);

notify pgrst, 'reload schema';
