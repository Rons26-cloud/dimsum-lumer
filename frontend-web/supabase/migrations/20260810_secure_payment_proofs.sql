-- Bukti pembayaran bersifat privat dan hanya dapat diakses pemilik/admin.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_proof_path TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-proofs', 'payment-proofs', false, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "payment_proofs_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_admin_select" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_owner_delete" ON storage.objects;

CREATE POLICY "payment_proofs_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "payment_proofs_owner_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "payment_proofs_admin_select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'payment-proofs' AND public.is_admin());
CREATE POLICY "payment_proofs_owner_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE OR REPLACE FUNCTION public.submit_payment_proof(p_order_id uuid, p_proof_path text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, storage AS $$
DECLARE v_order public.orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'User tidak terautentikasi'; END IF;
  IF p_proof_path !~ ('^' || auth.uid()::text || '/' || p_order_id::text || '/[a-zA-Z0-9_-]+\.(jpg|png|webp|pdf)$') THEN
    RAISE EXCEPTION 'Lokasi bukti pembayaran tidak valid';
  END IF;
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pesanan tidak ditemukan'; END IF;
  IF v_order.status <> 'pending' OR COALESCE(v_order.payment_status,'unpaid') NOT IN ('unpaid','failed') THEN
    RAISE EXCEPTION 'Pesanan tidak dapat menerima bukti pembayaran';
  END IF;
  IF v_order.created_at + interval '24 hours' <= now() THEN RAISE EXCEPTION 'Batas pembayaran sudah berakhir'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='payment-proofs' AND name=p_proof_path AND owner_id=auth.uid()::text) THEN
    RAISE EXCEPTION 'File bukti pembayaran tidak ditemukan';
  END IF;
  UPDATE public.orders SET payment_status='waiting_verification', payment_proof_path=p_proof_path, updated_at=now() WHERE id=p_order_id;
  RETURN jsonb_build_object('success',true,'payment_status','waiting_verification');
END; $$;

REVOKE ALL ON FUNCTION public.submit_payment_proof(uuid,text) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid,text) TO authenticated;
NOTIFY pgrst, 'reload schema';
