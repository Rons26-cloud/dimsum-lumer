import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client.js';
import { TABLES } from '../supabase/constants.js';

/**
 * Custom Hook useMaintenance
 * Memeriksa status pemeliharaan sistem (maintenance mode) untuk frontend web 
 * secara real-time, lengkap dengan pesan dan validasi rentang waktu.
 */
export function useMaintenance() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from(TABLES.MAINTENANCE)
          .select("is_active, message, start_time, end_time, target")
          .eq("target", "frontend-web")
          .maybeSingle();

        if (!isMounted) return;

        if (!error && data) {
          const now = new Date();
          const start = data.start_time ? new Date(data.start_time) : null;
          const end = data.end_time ? new Date(data.end_time) : null;

          let isActive = Boolean(data.is_active);

          // Validasi rentang waktu jika diatur
          if (isActive && start && end) {
            isActive = now >= start && now <= end;
          } else if (isActive && start) {
            isActive = now >= start;
          } else if (isActive && end) {
            isActive = now <= end;
          }

          setIsMaintenance(isActive);
          setMessage(data.message ?? '');
        } else {
          setIsMaintenance(false);
          setMessage('');
        }
      } catch (err) {
        console.error('Gagal memeriksa status pemeliharaan:', err);
        if (isMounted) {
          setIsMaintenance(false);
          setMessage('');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkMaintenance();

    // Setup Realtime Subscription untuk mendengarkan perubahan status dari Admin
    const channel = supabase
      .channel('realtime-maintenance-web')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLES.MAINTENANCE },
        (payload) => {
          const row = payload.new || payload.old;
          if (!row || row.target === 'frontend-web') {
            checkMaintenance();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { isMaintenance, message, loading };
}