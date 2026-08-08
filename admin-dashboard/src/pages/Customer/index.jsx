import { useState } from "react";
import { Search } from "lucide-react";
import { useLiveCollection } from "../../hooks/useLiveCollection.js";

export default function CustomerIndex() {
  // Tidak mengharuskan created_at agar tetap kompatibel dengan schema profiles lama.
  const profiles = useLiveCollection("profiles") || [];
  const [query, setQuery] = useState("");
  const rows = profiles
    .filter((profile) => `${profile.full_name || ""} ${profile.phone || ""}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  return <div className="space-y-4"><div><h1 className="text-xl font-bold">Pelanggan</h1><p className="text-sm text-gray-500">Daftar akun pelanggan realtime.</p></div><label className="flex max-w-sm items-center gap-2 rounded-xl border bg-white px-3"><Search size={15}/><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Cari nama atau telepon" className="w-full py-2.5 text-sm outline-none"/></label><div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="p-3">Nama</th><th>Telepon</th><th>Level</th><th>Role</th><th>Terdaftar</th></tr></thead><tbody>{rows.map((item)=><tr key={item.id} className="border-t"><td className="p-3 font-semibold">{item.full_name||"Tanpa nama"}</td><td>{item.phone||"-"}</td><td>{item.member_level||"Bronze"}</td><td>{item.role||"user"}</td><td>{item.created_at?new Date(item.created_at).toLocaleDateString("id-ID"):"-"}</td></tr>)}</tbody></table>{!rows.length&&<p className="p-8 text-center text-sm text-gray-400">Tidak ada pelanggan.</p>}</div></div>;
}
