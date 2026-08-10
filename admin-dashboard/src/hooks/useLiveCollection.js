import { useEffect, useState } from "react";
import { getAll } from "../supabase/database.js";
import { subscribeToTable } from "../supabase/realtime.js";

// Sama seperti di frontend-web: data selalu segar tanpa refresh. Dipakai supaya
// perubahan dari sisi customer (pesanan baru, review baru, dst) langsung
// terlihat di Admin Dashboard secara realtime.
export function useLiveCollection(table, options = {}) {
  const [data, setData] = useState(null);

  const normalizeRows = (rows) => rows.map((row) => {
    if (table === "products") return {
      ...row,
      name: row.name || row.nama || "Produk tanpa nama",
      description: row.description || row.deskripsi || "",
      price: row.price ?? row.harga ?? 0,
      image_url: row.image_url || row.image || row.gambar || null,
      category_id: row.category_id || row.kategori_id || null,
      is_active: row.is_active ?? row.status !== "nonaktif",
    };
    if (table === "categories") return {
      ...row,
      name: row.name || row.nama || "Kategori",
      image_url: row.image_url || row.icon_url || row.icon || null,
      is_active: row.is_active ?? row.status !== "nonaktif",
    };
    return row;
  });

  useEffect(() => {
    let mounted = true;
    const load = () => getAll(table, options)
      .then((rows) => {
        if (!mounted) return;
        setData(normalizeRows(rows));
        window.dispatchEvent(new CustomEvent("admin:data-success", { detail: { table } }));
      })
      .catch((error) => {
        console.error(`[Realtime] Gagal memuat tabel ${table}:`, error);
        if (!mounted) return;
        setData((current) => current ?? []);
        window.dispatchEvent(new CustomEvent("admin:data-error", {
          detail: { table, message: error?.message || "Data gagal dimuat." },
        }));
      });
    load();

    const unsubscribe = subscribeToTable(table, "*", () => load());
    const handleManualRefresh = (event) => {
      const requestedTable = event?.detail?.table;
      if (!requestedTable || requestedTable === table) load();
    };
    window.addEventListener("admin:refresh-data", handleManualRefresh);

    return () => {
      mounted = false;
      unsubscribe();
      window.removeEventListener("admin:refresh-data", handleManualRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  return data;
}
