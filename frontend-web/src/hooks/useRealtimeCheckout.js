import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase/client.js';
import { useRealtime } from './useRealtime.js';

export function useRealtimeCheckout(userId) {
  const [data, setData] = useState({ cartItems: [], profile: null, addresses: [], loading: true, error: null, lastUpdated: null });

  const fetchCheckoutData = useCallback(async () => {
    if (!userId) { setData((current) => ({ ...current, loading: false, error: 'Sesi pengguna tidak tersedia.' })); return; }
    setData((current) => ({ ...current, loading: current.lastUpdated === null, error: null }));
    let [cart, profile, addresses] = await Promise.all([
      supabase.from('cart_items').select('id, user_id, product_id, quantity, variant, flash_sale_id, unit_price, is_flash_sale, products(id, name, price, image_url, image, stock, is_active)').eq('user_id', userId).order('created_at'),
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('addresses').select('*').eq('user_id', userId),
    ]);
    if (cart.error && /flash_sale_id|unit_price|is_flash_sale|schema cache/i.test(cart.error.message || '')) {
      cart = await supabase.from('cart_items').select('id, user_id, product_id, quantity, variant, products(id, name, price, image_url, image, stock, is_active)').eq('user_id', userId).order('created_at');
    }
    const error = cart.error || profile.error || addresses.error;
    if (error) { setData((current) => ({ ...current, loading: false, error: error.message })); return; }
    const sortedAddresses = [...(addresses.data || [])].sort((first, second) => {
      if (Boolean(first.is_primary) !== Boolean(second.is_primary)) return first.is_primary ? -1 : 1;
      return new Date(second.created_at || 0) - new Date(first.created_at || 0);
    });
    setData({ cartItems: cart.data || [], profile: profile.data, addresses: sortedAddresses, loading: false, error: null, lastUpdated: new Date() });
  }, [userId]);

  useEffect(() => { fetchCheckoutData(); }, [fetchCheckoutData]);
  const cartStatus = useRealtime('cart_items', '*', fetchCheckoutData, userId ? `user_id=eq.${userId}` : null, Boolean(userId));
  const addressStatus = useRealtime('addresses', '*', fetchCheckoutData, userId ? `user_id=eq.${userId}` : null, Boolean(userId));
  useRealtime('profiles', 'UPDATE', fetchCheckoutData, userId ? `id=eq.${userId}` : null, Boolean(userId));

  return { ...data, refresh: fetchCheckoutData, realtimeStatus: cartStatus === 'connected' && addressStatus === 'connected' ? 'connected' : 'connecting' };
}
