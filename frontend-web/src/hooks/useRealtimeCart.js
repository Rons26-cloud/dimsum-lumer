import { useCallback,useEffect,useRef } from "react";
import { supabase } from "../supabase/client.js";
import { useAuth } from "./useAuth.js";
import { useCart } from "./useCart.js";
import { runtimeId } from "../utils/runtimeId.js";

function mapCartRow(row){
  const product=row.products||{};
  return {
    ...product,
    id:product.id||row.product_id,
    product_id:row.product_id,
    cart_item_id:row.id,
    cart_key:`${row.product_id}:${row.variant||'Original'}:${row.flash_sale_id||'regular'}`,
    qty:Number(row.quantity||1),
    quantity:Number(row.quantity||1),
    variant:row.variant||'Original',
    price:Number(row.unit_price??product.price??0),
    unit_price:Number(row.unit_price??product.price??0),
    flash_sale_id:row.flash_sale_id||null,
    is_flash_sale:Boolean(row.is_flash_sale),
  };
}

export function useRealtimeCart(){
  const {user,loading}=useAuth();const replaceItems=useCart((state)=>state.replaceItems);const requestRef=useRef(0);
  const refresh=useCallback(async()=>{
    const request=++requestRef.current;
    if(!user){replaceItems([]);return;}
    let response=await supabase.from('cart_items').select('id,user_id,product_id,quantity,variant,flash_sale_id,unit_price,is_flash_sale,products(id,name,description,price,image,image_url,stock,is_active,slug)').eq('user_id',user.id).order('created_at');
    if(response.error&&/flash_sale_id|unit_price|is_flash_sale|slug|schema cache/i.test(response.error.message||''))response=await supabase.from('cart_items').select('id,user_id,product_id,quantity,variant,products(id,name,description,price,image,image_url,stock,is_active)').eq('user_id',user.id).order('created_at');
    if(request!==requestRef.current)return;
    if(response.error){console.error('Sinkronisasi keranjang gagal:',response.error.message);return;}
    replaceItems((response.data||[]).map(mapCartRow));
  },[replaceItems,user]);

  useEffect(()=>{
    if(loading)return undefined;
    refresh();
    if(!user)return undefined;
    const channel=supabase.channel(`cart-sync-${user.id}-${runtimeId()}`).on('postgres_changes',{event:'*',schema:'public',table:'cart_items',filter:`user_id=eq.${user.id}`},refresh).subscribe();
    const reconcile=()=>{if(document.visibilityState==='visible')refresh();};
    const checkoutComplete=()=>{requestRef.current+=1;replaceItems([]);refresh();};
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',reconcile);window.addEventListener('cart:refresh',refresh);window.addEventListener('cart:checkout-complete',checkoutComplete);
    return()=>{supabase.removeChannel(channel);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',reconcile);window.removeEventListener('cart:refresh',refresh);window.removeEventListener('cart:checkout-complete',checkoutComplete);};
  },[loading,refresh,replaceItems,user]);
}
