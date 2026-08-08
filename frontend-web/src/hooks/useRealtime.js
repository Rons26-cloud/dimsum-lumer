import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase/client.js';

export function useRealtime(table, event = '*', callback, filter = null, enabled = true) {
  const callbackRef = useRef(callback);
  const [status, setStatus] = useState('idle');

  useEffect(() => { callbackRef.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled || !table) { setStatus('idle'); return undefined; }
    const channel = supabase
      .channel(`realtime-${table}-${event}-${filter || 'all'}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event, schema: 'public', table, ...(filter ? { filter } : {}) }, (payload) => callbackRef.current?.(payload))
      .subscribe((nextStatus) => setStatus(nextStatus === 'SUBSCRIBED' ? 'connected' : nextStatus.toLowerCase()));

    return () => { supabase.removeChannel(channel); };
  }, [table, event, filter, enabled]);

  return status;
}

export const useOrderRealtime = (orderId, callback) => useRealtime('orders', '*', callback, orderId ? `id=eq.${orderId}` : null, Boolean(orderId));
export const useNotificationRealtime = (userId, callback) => useRealtime('notifications', 'INSERT', callback, userId ? `user_id=eq.${userId}` : null, Boolean(userId));

export function useRealtimeNotifications(userId) {
  const [unreadCount, setUnreadCount] = useState(0);
  const refresh = async () => {
    if (!userId) return;
    const { count, error } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_read', false);
    if (!error) setUnreadCount(count || 0);
  };
  useEffect(() => { refresh(); }, [userId]);
  useNotificationRealtime(userId, refresh);
  return { unreadCount };
}
