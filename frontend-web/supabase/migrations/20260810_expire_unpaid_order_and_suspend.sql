-- Pembatalan pesanan kedaluwarsa dan suspend akun secara aman di server.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_account_status_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active', 'suspended'));

CREATE OR REPLACE FUNCTION public.expire_unpaid_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'User tidak terautentikasi'; END IF;
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pesanan tidak ditemukan'; END IF;
  IF v_order.status <> 'pending' OR v_order.payment_status IN ('paid', 'verified') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak dapat dibatalkan');
  END IF;
  IF v_order.created_at + interval '24 hours' > now() THEN
    RAISE EXCEPTION 'Batas pembayaran belum berakhir';
  END IF;

  UPDATE public.orders
  SET status = 'cancelled', payment_status = 'failed', updated_at = now()
  WHERE id = p_order_id;
  UPDATE public.profiles
  SET account_status = 'suspended', suspended_at = now(),
      suspension_reason = 'Pembayaran pesanan melewati batas waktu', updated_at = now()
  WHERE id = auth.uid();

  RETURN jsonb_build_object('success', true, 'order_status', 'cancelled', 'account_status', 'suspended');
END;
$$;

REVOKE ALL ON FUNCTION public.expire_unpaid_order(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.expire_unpaid_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.expire_all_unpaid_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  WITH expired AS (
    UPDATE public.orders
    SET status = 'cancelled', payment_status = 'failed', updated_at = now()
    WHERE status = 'pending'
      AND COALESCE(payment_status, 'unpaid') NOT IN ('paid', 'verified')
      AND created_at + interval '24 hours' <= now()
    RETURNING user_id
  ), suspended AS (
    UPDATE public.profiles p
    SET account_status = 'suspended', suspended_at = now(),
        suspension_reason = 'Pembayaran pesanan melewati batas waktu', updated_at = now()
    WHERE p.id IN (SELECT user_id FROM expired)
    RETURNING p.id
  )
  SELECT count(*) INTO v_count FROM suspended;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_all_unpaid_orders() FROM public, anon, authenticated;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expire-unpaid-orders') THEN
    PERFORM cron.schedule('expire-unpaid-orders', '* * * * *', 'SELECT public.expire_all_unpaid_orders();');
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Jadwal pg_cron belum dapat dibuat: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
