import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatCard({ icon, iconBg, label, value, deltaLabel, deltaPositive = true }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 shadow-sm hover:shadow-card transition-shadow">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs sm:text-sm text-gray-500 truncate">{label}</p>
        <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {deltaLabel && (
          <p className={`flex items-center gap-0.5 text-[11px] sm:text-xs mt-1 font-medium ${deltaPositive ? "text-green-600" : "text-red-500"}`}>
            {deltaPositive ? <ArrowUp size={11} /> : <ArrowDown size={11} />} {deltaLabel}
          </p>
        )}
      </div>
    </div>
  );
}
