import { createClient } from 'npm:@supabase/supabase-js@2';
import { assertAllowedOrigin, corsHeaders } from '../_shared/cors.ts';

const json = (request: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(request), 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  try { assertAllowedOrigin(request); } catch { return json(request, { error: 'Origin tidak diizinkan.' }, 403); }
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  if (request.method !== 'POST') return json(request, { error: 'Method tidak diizinkan.' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');
    if (!url || !anonKey || !serviceKey || !authorization) return json(request, { error: 'Tidak terautentikasi.' }, 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json(request, { error: 'Sesi tidak valid.' }, 401);
    const { data: profile, error: profileError } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError) return json(request, { error: 'Akses administrator tidak dapat diverifikasi.' }, 403);
    if (!['admin', 'superadmin'].includes(profile?.role || '')) return json(request, { error: 'Hanya admin yang dapat melihat bukti pembayaran.' }, 403);
    const { data: assurance, error: assuranceError } = await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== 'aal2') {
      return json(request, { error: 'Verifikasi MFA administrator diperlukan.' }, 403);
    }
    const { order_id: orderId } = await request.json();
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error: orderError } = await admin.from('orders').select('payment_proof_path').eq('id', orderId).maybeSingle();
    if (orderError || !order?.payment_proof_path) return json(request, { error: 'Bukti pembayaran tidak ditemukan.' }, 404);
    const { data, error } = await admin.storage.from('payment-proofs').createSignedUrl(order.payment_proof_path, 300);
    if (error) throw error;
    return json(request, { signed_url: data.signedUrl, expires_in: 300 });
  } catch (error) {
    console.error('get-payment-proof:', error);
    return json(request, { error: 'Bukti pembayaran gagal dibuka.' }, 500);
  }
});
