import { Award } from "lucide-react";
const styles={Bronze:'bg-amber-100 text-amber-800 border border-amber-200',Silver:'bg-slate-100 text-slate-700 border border-slate-300',Gold:'bg-yellow-100 text-yellow-700 border border-yellow-300',Platinum:'bg-cyan-100 text-cyan-800 border border-cyan-300'};
export default function MemberBadge({ level='Bronze' }) { return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-extrabold ${styles[level]||styles.Bronze}`}><Award size={11}/>{level}</span>; }
