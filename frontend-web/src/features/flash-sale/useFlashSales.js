import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase/client.js';
import { mergeProductCatalog, resolveProductImage } from '../products/productAssets.js';

function createFallbackSales(products = []) {
  const startsAt = new Date(Date.now() - 60_000).toISOString();
  const endsAt = new Date(Date.now() + 86_400_000).toISOString();
  return products.slice(0, 4).map((product,index) => ({
    id:`fallback-${product.id}`,
    product_id:product.id,
    sale_price:Math.round(Number(product.price || 0) * 0.8),
    original_price:Number(product.price || 0),
    flash_stock:Math.max(1,Math.min(Number(product.stock || 10),10)),
    starts_at:startsAt,
    ends_at:endsAt,
    is_active:true,
    products:{...product,image_url:resolveProductImage(product,index)},
  }));
}

export function useFlashSales() {
  // Flash Sale harus langsung terlihat walaupun koneksi Supabase belum selesai.
  const [sales,setSales] = useState([]);
  const load = useCallback(async () => {
    try {
      if (import.meta.env.VITE_FLASH_SALES_TABLE === 'true') {
        const { data, error } = await supabase.from('flash_sales').select('id, product_id, sale_price, original_price, flash_stock, starts_at, ends_at, is_active, products(id, name, description, price, image_url, image, stock, is_active)').eq('is_active',true).order('ends_at');
        if (!error) {
          const activeSales = (data || []).filter((sale) => sale.products?.is_active !== false);
          if (activeSales.length) { setSales(activeSales); return; }
        }
      }
      const { data:products, error } = await supabase.from('products').select('id,name,description,price,image_url,image,stock,is_active').eq('is_active',true).limit(4);
      setSales(createFallbackSales(mergeProductCatalog(!error ? products : null)));
    } catch (error) {
      console.error('Gagal memuat Flash Sale:', error);
      setSales([]);
    }
  },[]);
  useEffect(() => {
    load();
    let channel=supabase.channel(`customer-flash-sales-${crypto.randomUUID()}`).on('postgres_changes',{ event:'*', schema:'public', table:'products' },load);
    if(import.meta.env.VITE_FLASH_SALES_TABLE==='true') channel=channel.on('postgres_changes',{ event:'*', schema:'public', table:'flash_sales' },load);
    channel=channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  },[load]);
  return sales;
}
