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

  useEffect(() => {
    let mounted = true;

    const load = () => {
      getAll(table, options)
        .then((rows) => {
          if (mounted) setData(rows);
        })
        .catch((error) => {
          console.error(`Gagal memuat ${table}:`, error?.message || error);
          // Jangan menghapus data yang sudah tampil hanya karena koneksi
          // realtime terputus sesaat.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return data;
}
