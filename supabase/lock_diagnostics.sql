-- Jalankan di SQL Editor bila migrasi masih menghasilkan SQLSTATE 55P03.
-- Query ini hanya membaca kondisi lock; tidak menghentikan koneksi apa pun.
select
  blocked.pid as blocked_pid,
  now() - blocked.query_start as blocked_for,
  left(blocked.query, 160) as blocked_query,
  blocker.pid as blocker_pid,
  blocker.state as blocker_state,
  now() - blocker.xact_start as blocker_transaction_age,
  left(blocker.query, 160) as blocker_query
from pg_stat_activity blocked
cross join lateral unnest(pg_blocking_pids(blocked.pid)) as blocking(pid)
join pg_stat_activity blocker on blocker.pid = blocking.pid
where blocked.datname = current_database()
order by blocked.query_start;

-- Transaksi "idle in transaction" yang lama adalah penyebab lock yang umum.
select
  pid,
  usename,
  application_name,
  client_addr,
  now() - xact_start as transaction_age,
  left(query, 200) as last_query
from pg_stat_activity
where datname = current_database()
  and state = 'idle in transaction'
order by xact_start;
