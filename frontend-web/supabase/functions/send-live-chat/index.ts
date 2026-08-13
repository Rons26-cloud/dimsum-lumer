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
    if (!url || !anonKey || !serviceKey || !authorization) return json(request, { error: 'Sesi live chat belum siap.' }, 401);
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json(request, { error: 'Sesi tidak valid.' }, 401);
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const customerName = String(body?.customer_name || user.user_metadata?.full_name || user.email || 'Pengunjung').trim().slice(0, 100);
    const customerPhone = String(body?.customer_phone || '').replace(/\D/g, '').replace(/^0/, '62');
    if (!message || message.length > 1000) return json(request, { error: 'Pesan harus berisi 1–1000 karakter.' }, 400);
    if (customerName.length < 2) return json(request, { error: 'Nama minimal 2 karakter.' }, 400);
    if (customerPhone && !/^62\d{8,15}$/.test(customerPhone)) return json(request, { error: 'Nomor WhatsApp tidak valid.' }, 400);

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const recent = await admin.from('live_chat_messages').select('id',{count:'exact',head:true}).eq('user_id',user.id).gte('created_at',new Date(Date.now()-60_000).toISOString());
    if ((recent.count||0)>=8) return json(request,{error:'Terlalu banyak pesan. Tunggu satu menit lalu coba lagi.'},429);
    let { data: conversation } = await admin.from('live_chat_conversations').select('id').eq('user_id', user.id).eq('status', 'open').maybeSingle();
    if (!conversation) {
      const created = await admin.from('live_chat_conversations').insert({ user_id: user.id, customer_name: customerName, customer_phone: customerPhone || null, is_guest: user.is_anonymous === true }).select('id').single();
      if (created.error) throw created.error;
      conversation = created.data;
    } else {
      await admin.from('live_chat_conversations').update({customer_name:customerName,customer_phone:customerPhone||null,is_guest:user.is_anonymous===true}).eq('id',conversation.id);
    }
    const inserted = await admin.from('live_chat_messages').insert({ conversation_id: conversation.id, user_id: user.id, sender_role: 'customer', message }).select('id,created_at').single();
    if (inserted.error) throw inserted.error;
    await admin.from('live_chat_conversations').update({ last_message_at: inserted.data.created_at, updated_at: inserted.data.created_at, admin_read_at: null, admin_replied_at: null }).eq('id', conversation.id);

    let whatsappStatus = 'not_configured';
    const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
    const adminNumber = Deno.env.get('WHATSAPP_ADMIN_NUMBER');
    if (token && phoneNumberId && adminNumber) {
      const displayName = customerName;
      const forwarded = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: adminNumber.replace(/\D/g, ''), type: 'text', text: { preview_url: false, body: `Live Chat Dimsum Lumer\nDari: ${displayName}\nWhatsApp: ${customerPhone || '-'}\nPesan: ${message}` } }),
      });
      whatsappStatus = forwarded.ok ? 'sent' : 'failed';
    }
    await admin.from('live_chat_messages').update({ whatsapp_status: whatsappStatus }).eq('id', inserted.data.id);
    return json(request, { success: true, conversation_id: conversation.id, message_id: inserted.data.id, whatsapp_status: whatsappStatus });
  } catch (error) {
    console.error('send-live-chat:', error);
    return json(request, { error: 'Pesan belum dapat dikirim. Coba lagi sebentar.' }, 500);
  }
});
