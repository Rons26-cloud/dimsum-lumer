import ProgressLevel from "./ProgressLevel.jsx";

export default function PointCard({ point, orders, progress }) {
  const stats = [
    ["Poin", point.toLocaleString("id-ID")],
    ["Pesanan", orders.total],
    ["Level", progress.level],
  ];
  return (
    <div className="space-y-2.5">
      <section className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-white px-2 py-3 shadow-sm">
        {stats.map(([label, value]) => <div key={label} className="min-w-0 px-1 text-center"><strong className="block truncate text-sm font-bold text-gray-900">{value}</strong><span className="mt-0.5 block text-[9px] text-gray-500">{label}</span></div>)}
      </section>
      <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-[11px] font-bold text-gray-900">Level Member</h2><span className="text-[9px] font-semibold text-amber-600">{progress.level}</span></div>
        <ProgressLevel progress={progress} />
      </section>
    </div>
  );
}
