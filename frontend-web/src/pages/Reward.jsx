import { useEffect, useMemo, useState } from "react";
import { Check, Coins, Gift, Loader2, PackageCheck, Star } from "lucide-react";
import { getAvailableRewards, redeemReward } from "../services/rewardService.js";
import { usePoint } from "../hooks/usePoint.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProfilePageHeader from "../components/profile/ProfilePageHeader.jsx";
import { supabase } from "../supabase/client.js";
import originalImage from "../assets/produk/original.jpg";
import mentaiImage from "../assets/produk/dimsum-mentai-mozzarella.jpg";
import pangsitImage from "../assets/produk/pangsit-goreng-lumer.jpg";
import mixImage from "../assets/produk/mix.jpg";

const fallbackImages = [originalImage, mentaiImage, pangsitImage, mixImage];
const number = (value) => Number(value || 0).toLocaleString("id-ID");

export default function Reward() {
  const [rewards, setRewards] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [redeeming, setRedeeming] = useState(null);
  const [notice, setNotice] = useState(null);
  const { point, refresh } = usePoint();

  const load = () => getAvailableRewards().then(setRewards).catch(() => setRewards([]));
  useEffect(() => {
    load();
    const channel = supabase.channel("reward-catalog-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "rewards" }, load)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const selected = useMemo(() => rewards?.find((item) => item.id === selectedId), [rewards, selectedId]);
  const redeem = async (item) => {
    const cost = Number(item.point_required || item.point_cost || 0);
    if (!confirm(`Tukarkan ${number(cost)} poin dengan ${item.nama_reward || item.name}?`)) return;
    setRedeeming(item.id);
    setNotice(null);
    try {
      await redeemReward(item.id);
      await Promise.all([load(), refresh()]);
      setNotice({ ok: true, text: "Permintaan penukaran berhasil diterima dan sedang diproses." });
    } catch (error) {
      setNotice({ ok: false, text: error.message || "Penukaran reward belum dapat diproses." });
    } finally {
      setRedeeming(null);
    }
  };

  return <div className="space-y-5 text-black">
    <ProfilePageHeader title="Reward" />
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-black">Program Loyalitas</p><h1 className="mt-2 text-xl font-bold text-black">Reward Pelanggan</h1><p className="mt-2 max-w-md text-xs leading-5 text-black">Tukarkan poin dengan produk, voucher, dan manfaat keanggotaan yang tersedia.</p></div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-black"><Gift size={21}/></span>
      </div>
      <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Coins size={20} className="text-black"/><span><small className="block text-[10px] text-black">Saldo poin</small><strong className="text-lg text-black">{number(point)} poin</strong></span>
      </div>
    </section>

    {notice && <div className={`rounded-2xl border p-4 text-xs font-semibold text-black ${notice.ok ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>{notice.text}</div>}
    {rewards === null ? <div className="grid min-h-40 place-items-center"><Loader2 className="animate-spin text-black"/></div>
      : rewards.length === 0 ? <EmptyState icon={Gift} title="Reward belum tersedia" description="Katalog reward akan ditampilkan setelah diaktifkan oleh pengelola."/>
      : <section>
        <div className="mb-3 flex items-end justify-between"><div><h2 className="text-sm font-bold text-black">Katalog Reward</h2><p className="mt-1 text-[10px] text-black">Pilih reward untuk melihat status dan melakukan penukaran.</p></div><span className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[10px] font-bold text-black">{rewards.length} pilihan</span></div>
        <div className="grid gap-4 sm:grid-cols-2">{rewards.map((item, index) => {
          const cost = Number(item.point_required ?? item.point_cost ?? 0);
          const stock = Number(item.stok ?? 0);
          const available = point >= cost && stock > 0;
          const active = selectedId === item.id;
          const image = item.gambar || item.image_url || fallbackImages[index % fallbackImages.length];
          return <article key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer overflow-hidden rounded-3xl border-2 bg-white shadow-sm transition ${active ? "border-primary ring-4 ring-primary/10" : "border-slate-200"}`}>
            <div className="relative h-40 overflow-hidden bg-slate-100"><img src={image} alt={item.nama_reward || item.name} className="h-full w-full object-cover"/><span className={`absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[9px] font-bold ${active ? "border-primary bg-primary text-white" : "border-slate-300 bg-white text-black"}`}>{item.category || "Reward"}</span>{item.is_featured && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[9px] font-bold text-black"><Star size={10}/>Unggulan</span>}</div>
            <div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-black">{item.nama_reward || item.name}</h3><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-black">{item.deskripsi || item.description || "Reward keanggotaan Dimsum Lumer."}</p></div><PackageCheck size={18} className={active ? "shrink-0 text-primary" : "shrink-0 text-black"}/></div>
              <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-[10px] text-black"><div><dt>Poin diperlukan</dt><dd className="mt-1 font-bold">{number(cost)} poin</dd></div><div><dt>Persediaan</dt><dd className="mt-1 font-bold">{stock > 0 ? `${number(stock)} tersedia` : "Tidak tersedia"}</dd></div></dl>
              {item.terms && <p className="mt-3 text-[10px] leading-4 text-black">Syarat: {item.terms}</p>}
              <button type="button" onClick={(event) => { event.stopPropagation(); active ? redeem(item) : setSelectedId(item.id); }} disabled={(active && !available) || redeeming === item.id} className={`mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border text-xs font-bold transition disabled:border-slate-200 disabled:bg-slate-100 disabled:text-black ${active ? "border-primary bg-primary text-white" : "border-black bg-white text-black"}`}>{redeeming === item.id ? <Loader2 size={15} className="animate-spin"/> : active ? <Check size={15}/> : <Gift size={15}/>} {active ? (stock <= 0 ? "Tidak Tersedia" : point < cost ? `Kurang ${number(cost-point)} poin` : "Tukarkan Reward") : "Pilih Reward"}</button>
            </div>
          </article>;
        })}</div>
        {selected && <p className="mt-4 text-center text-[10px] text-black">Reward terpilih: <strong>{selected.nama_reward || selected.name}</strong></p>}
      </section>}
  </div>;
}
