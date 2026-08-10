import { useEffect, useState } from "react";
import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";
import { useAuth } from "./useAuth.js";
import { runtimeId } from "../utils/runtimeId.js";

/**
 * Custom Hook useNotifications
 * Menghitung notifikasi belum dibaca & memperbaruinya secara realtime —
 * dipakai untuk badge lonceng di Navbar.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase
      .from(TABLES.NOTIFICATIONS)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (mounted) setNotifications(data ?? []);
      })
      .catch(() => {
        if (mounted) setNotifications([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const channel = supabase
      .channel(`realtime-notifications-${user.id}-${runtimeId()}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: TABLES.NOTIFICATIONS, 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          setNotifications((prev) => {
            if (payload.eventType === "INSERT") return [payload.new, ...prev];
            if (payload.eventType === "UPDATE") return prev.map((n) => (n.id === payload.new.id ? payload.new : n));
            if (payload.eventType === "DELETE") return prev.filter((n) => n.id !== payload.old.id);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const { error } = await supabase
      .from(TABLES.NOTIFICATIONS)
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    if (error) throw error;
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
  };

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead };
}
