import { Link, useNavigate } from "react-router-dom";
import { Heart, ImageOff, Plus, Star } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist.js";
import { resolveProductImage } from "../../features/products/productAssets.js";
import { isLowStock, isOutOfStock, productStock } from "../../utils/productStock.js";

export function ProductCardView({product,wishlisted=false,onToggleWishlist,busy=false}){
  const productImage=resolveProductImage(product);
  const productName=String(product?.name||product?.title||product?.slug||'Produk Dimsum').trim();
  const destination=`/produk/${product.slug||product.id}`;
  const unavailable=isOutOfStock(product);const lowStock=isLowStock(product);const stock=productStock(product);
  return <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-2.5 shadow-sm">
    <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100"><Link to={destination} className="block h-full">{productImage?<img src={productImage} alt={product.name} className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${unavailable?'grayscale opacity-60':''}`}/>:<div className="grid h-full place-items-center text-gray-300"><ImageOff size={26} strokeWidth={1.5}/></div>}</Link>{(unavailable||lowStock)&&<span className={`absolute left-2 top-2 rounded-full px-2 py-1 text-[8px] font-extrabold text-white shadow-sm ${unavailable?'bg-gray-900':'bg-red-500'}`}>{unavailable?'Habis':`Sisa ${stock}`}</span>}<button type="button" onClick={(event)=>{event.preventDefault();onToggleWishlist?.(product,event);}} disabled={busy} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur active:scale-90 disabled:opacity-50" aria-label={wishlisted?`Hapus ${product.name} dari favorit`:`Simpan ${product.name} ke favorit`}><Heart size={15} strokeWidth={2} fill={wishlisted?'#FF7A00':'none'} className={wishlisted?'text-primary':'text-gray-500'}/></button></div>
    <Link to={destination}><p className="mt-2 min-h-10 line-clamp-2 text-xs font-semibold leading-5 text-gray-900">{productName}</p></Link>
    <div className="mt-auto flex items-end justify-between gap-2 pt-1.5"><div><p className="whitespace-nowrap text-xs font-extrabold text-dark">Rp{Number(product.price??0).toLocaleString('id-ID')}</p><div className="mt-1 flex items-center gap-1"><Star size={12} fill="#FFC107" className="text-accent" strokeWidth={0}/><span className="text-[10px] font-semibold text-gray-500">{product.rating??'4.8'}</span><span className="text-[9px] text-gray-400">· {Number(product.sold_count||product.total_sold||0).toLocaleString('id-ID')} terjual</span></div></div><Link to={destination} aria-label={`Tambah ${productName}`} className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-white shadow-sm ${unavailable?'pointer-events-none bg-gray-300':'bg-primary'}`}><Plus size={16}/></Link></div>
  </article>;
}

export default function ProductCard({product}){
  const wishlist=useWishlist();const navigate=useNavigate();
  const toggle=async(item)=>{const result=await wishlist.toggleWishlist(item.id);if(result.requiresLogin)navigate('/login');};
  return <ProductCardView product={product} wishlisted={wishlist.isWishlisted(product.id)} onToggleWishlist={toggle}/>;
}
