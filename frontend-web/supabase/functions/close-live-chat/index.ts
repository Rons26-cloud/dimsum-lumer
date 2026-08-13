import { createClient } from 'npm:@supabase/supabase-js@2';
import { assertAllowedOrigin, corsHeaders } from '../_shared/cors.ts';

const json=(request:Request,body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders(request),'Content-Type':'application/json'}});

Deno.serve(async(request)=>{
  try{assertAllowedOrigin(request)}catch{return json(request,{error:'Origin tidak diizinkan.'},403)}
  if(request.method==='OPTIONS')return new Response('ok',{headers:corsHeaders(request)});
  if(request.method!=='POST')return json(request,{error:'Method tidak diizinkan.'},405);
  try{
    const url=Deno.env.get('SUPABASE_URL'),anonKey=Deno.env.get('SUPABASE_ANON_KEY'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),authorization=request.headers.get('Authorization');
    if(!url||!anonKey||!serviceKey||!authorization)return json(request,{error:'Sesi live chat belum siap.'},401);
    const userClient=createClient(url,anonKey,{global:{headers:{Authorization:authorization}}});
    const {data:{user},error:authError}=await userClient.auth.getUser();
    if(authError||!user)return json(request,{error:'Sesi tidak valid.'},401);
    const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const now=new Date().toISOString();
    const {error}=await admin.from('live_chat_conversations').update({status:'resolved',resolved_at:now,resolved_by:null,updated_at:now}).eq('user_id',user.id).eq('status','open');
    if(error)throw error;
    return json(request,{success:true,is_guest:user.is_anonymous===true});
  }catch(error){console.error('close-live-chat:',error);return json(request,{error:'Live chat belum dapat ditutup.'},500)}
});
