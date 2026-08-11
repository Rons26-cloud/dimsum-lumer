import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client.js';
import { TABLES } from '../supabase/constants.js';


export function useMaintenance() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkMaintenance = async () => {
      try {
        const rpcResult = await supabase.rpc("get_maintenance_status", { p_target:"frontend-web" });
        let data = rpcResult.data ? [rpcResult.data] : null;
        let error = rpcResult.error;
        if (error) {
          const fallback = await supabase.from(TABLES.MAINTENANCE).select("*").in("target", ["frontend-web", "both"]).order("updated_at", { ascending:false }).limit(10);
          data=fallback.data;error=fallback.error;
        }

        if (!isMounted) return;

        const candidates = Array.isArray(data) ? data : [];
        const now = new Date();
        const isEffective = (item) => {
          if (!item?.is_active) return false;
          const itemStart = item.start_time ? new Date(item.start_time) : null;
          const itemEnd = item.end_time ? new Date(item.end_time) : null;
          return (!itemStart || now >= itemStart) && (!itemEnd || now <= itemEnd);
        };
        const row = candidates.find((item) => item.target === "frontend-web" && isEffective(item)) || candidates.find((item) => item.target === "both" && isEffective(item)) || candidates.find((item) => item.target === "frontend-web") || candidates.find((item) => item.target === "both") || null;
        if (!error && row) {
          const start = row.start_time ? new Date(row.start_time) : null;
          const end = row.end_time ? new Date(row.end_time) : null;

          let isActive = Boolean(row.is_active);

          if (isActive && start && end) {
            isActive = now >= start && now <= end;
          } else if (isActive && start) {
            isActive = now >= start;
          } else if (isActive && end) {
            isActive = now <= end;
          }

          setEnabled(isActive);
          setMessage(row.message ?? '');
          setStartTime(row.start_time ?? null);
          setEndTime(row.end_time ?? null);
        } else {
          setEnabled(false);
          setMessage('');
          setStartTime(null);
          setEndTime(null);
        }
      } catch (err) {
        console.error('Gagal memeriksa status pemeliharaan:', err);
        if (isMounted) {
          setEnabled(false);
          setMessage('');
          setStartTime(null);
          setEndTime(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkMaintenance();
    const poller = window.setInterval(checkMaintenance, 10000);
    const refreshWhenVisible = () => { if (document.visibilityState === 'visible') checkMaintenance(); };
    window.addEventListener('focus', checkMaintenance);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    const channel = supabase
      .channel('realtime-maintenance-web')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLES.MAINTENANCE },
        (payload) => {
          const row = payload.new || payload.old;
          if (!row || row.target === 'frontend-web' || row.target === 'both') {
            checkMaintenance();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      window.clearInterval(poller);
      window.removeEventListener('focus', checkMaintenance);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      supabase.removeChannel(channel);
    };
  }, []);

  const startMs = startTime ? new Date(startTime).getTime() : null;
  const endMs = endTime ? new Date(endTime).getTime() : null;
  const withinWindow = (!startMs || clock >= startMs) && (!endMs || clock <= endMs);
  const isMaintenance = enabled && withinWindow;
  const isUpcoming = enabled && Boolean(startMs) && clock < startMs && (!endMs || clock < endMs);
  return { isMaintenance, isUpcoming, message, startTime, endTime, loading, countdownMs: isUpcoming ? Math.max(0, startMs - clock) : 0 };
}
