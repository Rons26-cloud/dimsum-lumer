import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth.js";
import { supabase } from "../supabase/client.js";
import { TABLES } from "../supabase/constants.js";
import * as service from "../services/notificationService.js";
import { runtimeId } from "../utils/runtimeId.js";

export function useNotification() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user) { setNotifications([]); setLoading(false); return; }
    try { setError(""); setNotifications(await service.getUserNotifications(user.id)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return undefined;
    const channel = supabase.channel(`notification-center-${user.id}-${runtimeId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: TABLES.NOTIFICATIONS, filter: `user_id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refresh, user]);

  useEffect(() => {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return undefined;
    const channel = supabase.channel(`notification-push-${user?.id || "guest"}-${runtimeId()}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: TABLES.NOTIFICATIONS, ...(user ? { filter: `user_id=eq.${user.id}` } : {}) }, ({ new: item }) => {
        if (document.visibilityState === "visible") new Notification(item.title || "Dimsum Lumer", { body: item.message || "", icon: "/logo.png", tag: item.id });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.is_read).length, [notifications]);
  const read = async (id) => { if(!user)return;await service.markAsRead(id,user.id);setNotifications((items)=>items.map((item)=>item.id===id?{...item,is_read:true}:item)); };
  const readAll = async () => { if(!user)return;await service.markAllAsRead(user.id);setNotifications((items)=>items.map((item)=>({...item,is_read:true}))); };
  const remove = async (id) => { if(!user)return;await service.deleteNotification(id,user.id);setNotifications((items)=>items.filter((item)=>item.id!==id)); };
  const removeAll = async () => { if(!user)return;await service.deleteAllNotifications(user.id);setNotifications([]); };
  const requestPermission = async () => {
    if (!("Notification" in window)) throw new Error("Browser tidak mendukung push notification.");
    const permission = await Notification.requestPermission();
    if(user)await service.saveNotificationPermission(user.id, permission);
    return permission;
  };
  return { notifications, loading, error, unreadCount, refresh, read, readAll, remove, removeAll, requestPermission };
}
