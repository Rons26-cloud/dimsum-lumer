-- Kolom pembayaran otomatis. Aman dijalankan ulang.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider TEXT,
  ADD COLUMN IF NOT EXISTS payment_token TEXT,
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_payment_provider_status
  ON public.orders (payment_provider, payment_status);

NOTIFY pgrst, 'reload schema';
