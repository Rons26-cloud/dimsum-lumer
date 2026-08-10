import { ArrowRight, ImageOff, PackageOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../ui/Card.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

const rupiah = formatCurrency;

export default function ProductCatalogOverview({ products = [] }) {
  const activeCount = products.filter((product) => product.is_active !== false).length;
  const action = <Link to="/produk" className="inline-flex items-center gap-1">Kelola semua <ArrowRight size={13}/></Link>;

  return <Card title="Katalog Produk di Beranda" action={action}>
    <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
      <span className="rounded-full bg-gray-100 px-3 py-1.5 font-semibold text-gray-600">{products.length} produk</span>
      <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-600">{activeCount} aktif di pelanggan</span>
      {products.length > activeCount && <span className="rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-600">{products.length - activeCount} nonaktif</span>}
    </div>

    {products.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {products.map((product) => {
        const imageUrl = product.image_url || product.image || product.gambar;
        return <article key={product.id} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
          <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
            {imageUrl ? <img src={imageUrl} alt={product.name || "Produk"} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/> : <div className="grid h-full place-items-center text-gray-300"><ImageOff size={28}/></div>}
            <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[9px] font-bold shadow-sm ${product.is_active !== false ? "bg-emerald-500 text-white" : "bg-gray-700 text-white"}`}>{product.is_active !== false ? "Aktif" : "Nonaktif"}</span>
          </div>
          <div className="p-3.5">
            <div className="flex items-start justify-between gap-2"><h3 className="line-clamp-2 text-sm font-bold leading-5 text-gray-900">{product.name || product.nama || "Produk tanpa nama"}</h3><strong className="shrink-0 text-xs text-primary">{rupiah(product.price ?? product.harga)}</strong></div>
            <p className="mt-1.5 line-clamp-2 min-h-9 text-[10px] leading-[18px] text-gray-500">{product.description || product.deskripsi || "Belum ada penjelasan produk."}</p>
            <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2.5 text-[10px]"><span className="text-gray-400">Stok tersedia</span><strong className={Number(product.stock || 0) <= 10 ? "text-red-500" : "text-gray-700"}>{Number(product.stock || 0).toLocaleString("id-ID")}</strong></div>
          </div>
        </article>;
      })}
    </div> : <div className="grid min-h-44 place-items-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 text-center"><div><PackageOpen className="mx-auto text-gray-300" size={30}/><p className="mt-2 text-sm font-semibold text-gray-600">Belum ada produk</p><p className="mt-1 text-xs text-gray-400">Tambahkan produk agar tampil di beranda Web dan APK.</p><Link to="/produk" className="mt-3 inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white">Tambah produk <ArrowRight size={13}/></Link></div></div>}
  </Card>;
}
