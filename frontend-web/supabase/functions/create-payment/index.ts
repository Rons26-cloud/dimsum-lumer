import { createClient } from 'npm:@supabase/supabase-js@2';
import { assertAllowedOrigin, corsHeaders, officialFrontendOrigin } from '../_shared/cors.ts';

const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
});

Deno.serve(async (request) => {
  try { assertAllowedOrigin(request); } catch { return json(request, { error: 'Origin tidak diizinkan.' }, 403); }
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Method tidak diizinkan.' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) return json(request, { error: 'Konfigurasi Supabase pada Edge Function belum lengkap.' }, 500);
    if (!serverKey) return json(request, { error: 'MIDTRANS_SERVER_KEY belum dipasang. Gunakan pembayaran manual atau hubungi admin.' }, 503);

    const authorization = request.headers.get('Authorization');
    if (!authorization) return json(request, { error: 'Silakan login kembali sebelum membayar.' }, 401);
    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return json(request, { error: 'Sesi login tidak valid. Silakan login kembali.' }, 401);

    const body = await request.json().catch(() => ({}));
    const orderId = String(body?.order_id || '');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) return json(request, { error: 'order_id tidak valid.' }, 400);

    const { data: order, error: orderError } = await client.from('orders').select('id,order_code,total_amount,total_price,payment_status,payment_url,status,created_at').eq('id', orderId).eq('user_id', user.id).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json(request, { error: 'Pesanan tidak ditemukan atau bukan milik akun ini.' }, 404);
    if (order.status !== 'pending') return json(request, { error: 'Pesanan ini tidak lagi dapat dibayar.' }, 409);
    if (new Date(order.created_at).getTime() + 24 * 60 * 60 * 1000 <= Date.now()) return json(request, { error: 'Batas waktu pembayaran sudah berakhir.' }, 410);
    if (['paid', 'verified'].includes(order.payment_status)) return json(request, { error: 'Pesanan ini sudah dibayar.' }, 409);
    if (order.payment_url) return json(request, { redirect_url: order.payment_url, reused: true });

    const grossAmount = Math.round(Number(order.total_amount || order.total_price || 0));
    if (!Number.isFinite(grossAmount) || grossAmount < 1) return json(request, { error: 'Nominal pesanan tidak valid.' }, 400);
    const merchantOrderId = String(order.order_code || order.id).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 50);
    const production = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
    const endpoint = production ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
    const gatewayResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${serverKey}:`)}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        transaction_details: { order_id: merchantOrderId, gross_amount: grossAmount },
        customer_details: { email: user.email },
        callbacks: { finish: `${officialFrontendOrigin()}/checkout/sukses` },
      }),
    });
    const gateway = await gatewayResponse.json().catch(() => ({}));
    if (!gatewayResponse.ok || !gateway.redirect_url) return json(request, { error: gateway.error_messages?.join(', ') || 'Gateway gagal membuat transaksi.' }, 502);

    const { error: updateError } = await admin.from('orders').update({ payment_url: gateway.redirect_url, payment_token: gateway.token, payment_provider: 'midtrans', payment_status: 'unpaid' }).eq('id', order.id).eq('user_id', user.id).eq('status', 'pending');
    if (updateError) throw updateError;
    return json(request, { redirect_url: gateway.redirect_url, token: gateway.token });
  } catch (error) {
    console.error('create-payment:', error);
    return json(request, { error: error instanceof Error ? error.message : 'Pembayaran otomatis gagal dibuat.' }, 500);
  }
});
