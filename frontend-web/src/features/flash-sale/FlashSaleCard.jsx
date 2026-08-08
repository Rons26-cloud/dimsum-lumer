import { Flame, ImageOff, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveFlashSaleImage } from "./flashSaleAssets.js";

export function FlashSaleCard({ sale }) {
  const product = sale.products;
  const productImage = resolveFlashSaleImage(product);
  const saleProduct = {
    ...product,
    price: Number(sale.sale_price),
    original_price: Number(sale.original_price || product?.price),
  };
  const discount = saleProduct.original_price > 0
    ? Math.round(((saleProduct.original_price - saleProduct.price) / saleProduct.original_price) * 100)
    : 0;
  const detailUrl = `/flash-sale/${sale.id}`;

  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-primary-100 bg-white p-1.5 shadow-sm">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-orange-50">
        <Link to={detailUrl} className="block h-full">
          {productImage ? <img src={productImage} alt={product.name} className="h-full w-full object-cover" loading="lazy" /> : <span className="grid h-full place-items-center text-gray-300"><ImageOff size={24} /></span>}
        </Link>
        <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded-full bg-primary px-1 py-0.5 text-[7px] font-extrabold text-white"><Flame size={7} />-{discount}%</span>
      </div>
      <div className="flex min-h-[82px] flex-1 flex-col pt-1.5">
        <div className="flex items-center justify-between gap-1 text-[9px]"><span className="flex items-center gap-0.5 text-amber-600"><Star size={9} fill="currentColor" /> {product?.rating || "4.8"}</span><span className="truncate text-gray-400">Sisa {sale.flash_stock}</span></div>
        <Link to={detailUrl} className="mt-1 line-clamp-2 min-h-[26px] text-[9px] font-bold leading-3 text-gray-800 xs:text-xs">{product?.name}</Link>
        <div className="mt-auto pt-2"><span className="block whitespace-nowrap text-[8px] text-gray-400 line-through">Rp{saleProduct.original_price.toLocaleString("id-ID")}</span><strong className="block whitespace-nowrap text-[9px] text-dark xs:text-[10px]">Rp{saleProduct.price.toLocaleString("id-ID")}</strong></div>
      </div>
    </article>
  );
}
