import { useEffect, useState } from "react";
import { getAll } from "../supabase/database.js";
import { subscribeToTable } from "../supabase/realtime.js";


export function useLiveCollection(table, options = {}) {
  const [data, setData] = useState(null);
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    let mounted = true;

    const currentOptions = JSON.parse(optionsKey);
    const load = () => {
      getAll(table, currentOptions)
        .then((rows) => {
          if (mounted) setData(rows);
        })
        .catch((error) => {
          console.error(`Gagal memuat ${table}:`, error?.message || error);
          if (mounted) setData((current) => current ?? []);
        });
    };

    load();

    const unsubscribe = subscribeToTable(table, "*", () => {
      load();
    });

    return () => {
      mounted = false;
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, [table, optionsKey]);

  return data;
}
