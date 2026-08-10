import { useLiveCollection } from "../../hooks/useLiveCollection.js";

export default function MemberIndex() {
  const profiles = (useLiveCollection("profiles") || [])
    .filter((item) => !["admin", "superadmin"].includes(item.role));
  const levels = ["Bronze", "Silver", "Gold", "Platinum"];

  return <div className="space-y-4">
    <div><h1 className="text-xl font-bold">Member</h1><p className="text-sm text-gray-500">Ringkasan level dan poin pelanggan.</p></div>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {levels.map((level) => <div key={level} className="rounded-2xl border bg-white p-5"><p className="text-sm text-gray-500">{level}</p><strong className="mt-2 block text-2xl">{profiles.filter((item) => (item.member_level || "Bronze") === level).length}</strong></div>)}
    </div>
    <div className="rounded-2xl border bg-white p-4">
      {profiles.map((item) => <div key={item.id} className="flex justify-between border-b py-3 text-sm"><span>{item.full_name || "Pelanggan"}</span><span className="font-semibold">{item.point || 0} poin · {item.member_level || "Bronze"}</span></div>)}
      {!profiles.length && <p className="py-6 text-center text-sm text-gray-400">Belum ada data member.</p>}
    </div>
  </div>;
}
