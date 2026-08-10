import { supabase } from '../supabase/client.js';

const normalizeName=(value)=>String(value||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');

export async function resolveServerProduct(product){
  const requestedId=product?.product_id||product?.id;
  if(requestedId){
    const {data,error}=await supabase.from('products').select('id,name,price,stock,is_active').eq('id',requestedId).maybeSingle();
    if(error)throw error;
    if(data)return data;
  }
  const name=String(product?.name||'').trim();
  if(!name)return null;
  const {data,error}=await supabase.from('products').select('id,name,price,stock,is_active').ilike('name',name).limit(10);
  if(error)throw error;
  const normalized=normalizeName(name);
  return (data||[]).find((item)=>normalizeName(item.name)===normalized)
    || (data||[]).find((item)=>normalizeName(item.name).includes(normalized)||normalized.includes(normalizeName(item.name)))
    || null;
}

export async function upsertCartItem({userId,product,quantity=1,variant='Original',flashSaleId=null,unitPrice=null}){
  if(!userId)throw new Error('Silakan login terlebih dahulu.');
  const registered=await resolveServerProduct(product);
  if(!registered)throw new Error(`${product?.name||'Produk'} belum ada di katalog Supabase. Sinkronkan katalog melalui Dashboard Admin.`);
  if(registered.is_active===false)throw new Error(`${registered.name} sedang dinonaktifkan oleh admin.`);
  const requestedQuantity=Math.max(1,Number(quantity||1));
  const stock=Number(registered.stock);
  if(Number.isFinite(stock)&&stock<=0)throw new Error(`${registered.name} sedang habis.`);
  if(Number.isFinite(stock)&&requestedQuantity>stock)throw new Error(`Stok ${registered.name} hanya tersisa ${stock}.`);
  const { error: rpcError } = await supabase.rpc('add_cart_item', {
    p_product_id: registered.id,
    p_quantity: requestedQuantity,
    p_variant: variant,
    p_flash_sale_id: flashSaleId,
    p_unit_price: Number(unitPrice ?? registered.price),
  });
  if (!rpcError) return registered;
  if (!/function|schema cache|add_cart_item/i.test(rpcError.message || '')) throw rpcError;
  const base={user_id:userId,product_id:registered.id,quantity:requestedQuantity,variant};
  const enriched={...base,flash_sale_id:flashSaleId,unit_price:Number(unitPrice??registered.price),is_flash_sale:Boolean(flashSaleId)};
  let {error}=await supabase.from('cart_items').upsert(enriched,{onConflict:'user_id,product_id,variant'});
  if(error&&/flash_sale_id|unit_price|is_flash_sale|schema cache/i.test(error.message||''))({error}=await supabase.from('cart_items').upsert(base,{onConflict:'user_id,product_id,variant'}));
  if(error)throw error;
  return registered;
}

export async function removeServerCartItem(userId,productId,variant){
  let query=supabase.from('cart_items').delete().eq('user_id',userId).eq('product_id',productId);
  if(variant)query=query.eq('variant',variant);
  const {error}=await query;if(error)throw error;
}
