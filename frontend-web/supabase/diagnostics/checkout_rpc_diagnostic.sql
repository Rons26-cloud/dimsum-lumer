-- Jalankan di Supabase SQL Editor. Query ini tidak mengubah data.

-- 1. Semua overload checkout_order_v2 yang aktif beserta parameternya.
select
  p.oid::regprocedure as signature,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'checkout_order_v2';

-- 2. Function/trigger yang masih meminta kolom whatsapp.
select
  n.nspname as schema_name,
  p.proname as function_name,
  p.oid::regprocedure as signature
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosrc ilike '%whatsapp%';

-- 3. Tabel yang benar-benar memiliki kolom phone/whatsapp.
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and column_name in ('phone', 'whatsapp')
order by table_name, column_name;

-- 4. Trigger pada tabel yang disentuh checkout.
select
  event_object_table as table_name,
  trigger_name,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('orders', 'order_detail', 'order_items', 'products', 'cart_items')
order by event_object_table, trigger_name;
