import { useEffect, useState } from "react";
import { getAll } from "../supabase/database.js";
import { subscribeToTable } from "../supabase/realtime.js";

/**
 * Custom Hook useLiveCollection
 * Mengambil data awal dari tabel dan menjaganya tetap sinkron secara real-time.
 * Cocok digunakan untuk Produk, Kategori, atau Promo di halaman customer agar otomatis
 * terbarui saat admin melakukan perubahan data.
 */
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
          // Pertahankan snapshot terakhir saat koneksi terputus.
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
