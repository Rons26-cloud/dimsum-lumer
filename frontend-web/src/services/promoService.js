import { getAll } from "../supabase/database.js";
import { TABLES } from "../supabase/constants.js";
import { supabase } from "../supabase/client.js";

export const getActivePromos = () => getAll(TABLES.PROMOS, { filters: { is_active: true } });

export async function validatePromoCode(code, subtotal){
  const normalized=String(code||'').trim();
  if(!normalized)throw new Error('Masukkan kode promo.');
  const {data,error}=await supabase.from(TABLES.PROMOS).select('*').ilike('code',normalized).maybeSingle();
  if(error)throw error;
  if(!data||data.is_active===false)throw new Error('Kode promo tidak ditemukan atau sudah tidak aktif.');
  const now=Date.now();
  if(data.starts_at&&new Date(data.starts_at).getTime()>now)throw new Error('Promo belum dimulai.');
  if(data.ends_at&&new Date(data.ends_at).getTime()<now)throw new Error('Promo sudah berakhir.');
  if(Number(subtotal)<Number(data.min_purchase||0))throw new Error(`Minimum belanja Rp${Number(data.min_purchase||0).toLocaleString('id-ID')}.`);
  if(data.usage_limit!==null&&Number(data.used_count||0)>=Number(data.usage_limit))throw new Error('Kuota promo sudah habis.');
  const value=Number(data.discount_value??data.discount??0);
  let discount=data.discount_type==='percentage'?Number(subtotal)*value/100:value;
  if(data.max_discount!==null&&data.max_discount!==undefined)discount=Math.min(discount,Number(data.max_discount));
  return {...data,discount_amount:Math.max(0,Math.min(Number(subtotal),discount))};
}
