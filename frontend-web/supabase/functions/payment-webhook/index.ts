import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const sha512 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-512', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};
const safeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
};

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method tidak diizinkan.' }, 405);
  try {
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serverKey || !supabaseUrl || !serviceKey) return json({ error: 'Konfigurasi server belum lengkap.' }, 500);
    const payload = await request.json();
    const orderId = String(payload.order_id || '');
    const statusCode = String(payload.status_code || '');
    const grossAmount = String(payload.gross_amount || '');
    const signature = String(payload.signature_key || '').toLowerCase();
    if (!orderId || !statusCode || !grossAmount || !signature) return json({ error: 'Payload tidak lengkap.' }, 400);
    const expected = await sha512(`${orderId}${statusCode}${grossAmount}${serverKey}`);
    if (!safeEqual(signature, expected)) return json({ error: 'Signature tidak valid.' }, 401);

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await admin.from('orders').select('id,total_amount,total_price,payment_status').eq('order_code', orderId).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json({ error: 'Pesanan tidak ditemukan.' }, 404);
    const expectedAmount = Number(order.total_amount || order.total_price || 0);
    if (Math.abs(Number(grossAmount) - expectedAmount) > 0.01) return json({ error: 'Nominal pembayaran tidak cocok.' }, 400);

    const transactionStatus = String(payload.transaction_status || '');
    const fraudStatus = String(payload.fraud_status || 'accept');
    let paymentStatus = 'unpaid';
    if ((transactionStatus === 'capture' && fraudStatus === 'accept') || transactionStatus === 'settlement') paymentStatus = 'paid';
    else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) paymentStatus = 'failed';
    else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') paymentStatus = 'refunded';
    else if (transactionStatus === 'pending') paymentStatus = 'unpaid';

    const update: Record<string, unknown> = { payment_status: paymentStatus, updated_at: new Date().toISOString() };
    if (paymentStatus === 'paid') update.paid_at = new Date(payload.settlement_time || Date.now()).toISOString();
    const { error: updateError } = await admin.from('orders').update(update).eq('id', order.id);
    if (updateError) throw updateError;
    return json({ received: true });
  } catch (error) {
    console.error('payment-webhook:', error);
    return json({ error: 'Webhook gagal diproses.' }, 500);
  }
});

