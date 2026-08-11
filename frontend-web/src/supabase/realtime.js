import { supabase } from "./client";

export function subscribeToTable(table, event, callback, filter) {
  const channel = supabase
    .channel(`realtime-${table}-${Date.now()}`)
    .on(
      "postgres_changes",
      { event, schema: "public", table, ...(filter ? { filter } : {}) },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
