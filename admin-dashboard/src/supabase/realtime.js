import { supabase } from "./client.js";

export function subscribeToTable(table, event, callback, filter) {
  const channel = supabase
    .channel(`admin-realtime-${table}-${Date.now()}`)
    .on("postgres_changes", { event, schema: "public", table, ...(filter ? { filter } : {}) }, callback)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
