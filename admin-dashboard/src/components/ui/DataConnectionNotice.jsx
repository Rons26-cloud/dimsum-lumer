import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, X } from "lucide-react";

export default function DataConnectionNotice() {
  const [failures, setFailures] = useState({});

  useEffect(() => {
    const onError = (event) => {
      const { table = "data", message = "Data gagal dimuat." } = event.detail || {};
      setFailures((current) => ({ ...current, [table]: message }));
    };
    const onSuccess = (event) => {
      const table = event.detail?.table;
      if (!table) return;
      setFailures((current) => {
        if (!(table in current)) return current;
        const next = { ...current };
        delete next[table];
        return next;
      });
    };
    window.addEventListener("admin:data-error", onError);
    window.addEventListener("admin:data-success", onSuccess);
    return () => {
      window.removeEventListener("admin:data-error", onError);
      window.removeEventListener("admin:data-success", onSuccess);
    };
  }, []);

  const entries = Object.entries(failures);
  if (!entries.length) return null;

  return <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
    <AlertTriangle className="mt-0.5 shrink-0" size={18}/>
    <div className="min-w-0 flex-1">
      <p className="font-semibold">Sebagian data dashboard gagal dimuat</p>
      {entries.map(([table, message]) => <p key={table} className="mt-1 break-words text-xs"><strong>{table}:</strong> {message}</p>)}
    </div>
    <button type="button" onClick={() => window.location.reload()} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white" aria-label="Coba muat ulang"><RefreshCw size={15}/></button>
    <button type="button" onClick={() => setFailures({})} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" aria-label="Tutup pesan"><X size={15}/></button>
  </div>;
}
