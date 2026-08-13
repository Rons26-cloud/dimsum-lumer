import { supabase } from "./client";
import { runtimeId } from "../utils/runtimeId.js";

export function subscribeToTable(table, event, callback, filter) {
  const channel = supabase
    .channel(`realtime-${table}-${runtimeId()}`)
    .on(
      "postgres_changes",
      { event, schema: "public", table, ...(filter ? { filter } : {}) },
      (payload) => callback(payload)
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}
