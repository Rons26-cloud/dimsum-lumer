import { Link, useNavigate } from "react-router-dom";
import { Heart, ImageOff, Star } from "lucide-react";
import { useWishlist } from "../../hooks/useWishlist.js";
import { resolveProductImage } from "../../features/products/productAssets.js";

export function ProductCardView({product,wishlisted=false,onToggleWishlist,busy=false}){
  const productImage=resolveProductImage(product);
  const productName=String(product?.name||product?.title||product?.slug||'Produk Dimsum').trim();
  const destination=`/produk/${product.slug||product.id}`;
  return <article className="group flex h-full min-w-0 flex-col rounded-xl border border-gray-100 bg-white p-1.5 shadow-sm xs:p-2">
    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 xs:rounded-xl"><Link to={destination} className="block h-full">{productImage?<img src={productImage} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"/>:<div className="grid h-full place-items-center text-gray-300"><ImageOff size={24} strokeWidth={1.5}/></div>}</Link><button type="button" onClick={(event)=>{event.preventDefault();onToggleWishlist?.(product,event);}} disabled={busy} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur active:scale-90 disabled:opacity-50 xs:right-1.5 xs:top-1.5 xs:h-6 xs:w-6" aria-label={wishlisted?`Hapus ${product.name} dari favorit`:`Simpan ${product.name} ke favorit`}><Heart size={11} strokeWidth={2} fill={wishlisted?'#FF7A00':'none'} className={wishlisted?'text-primary':'text-gray-500'}/></button></div>
    <Link to={destination}><p className="mt-1.5 min-h-7 line-clamp-2 text-[9px] font-semibold leading-3.5 text-gray-900 xs:text-[10px]">{productName}</p></Link>
    <div className="mt-auto pt-1.5"><p className="whitespace-nowrap text-[9px] font-bold text-dark xs:text-[10px]">Rp{Number(product.price??0).toLocaleString('id-ID')}</p><div className="mt-0.5 flex items-center gap-0.5"><Star size={9} fill="#FFC107" className="text-accent" strokeWidth={0}/><span className="text-[8px] font-semibold text-gray-500">{product.rating??'4.8'}</span></div></div>
  </article>;
}

export default function ProductCard({product}){
  const wishlist=useWishlist();const navigate=useNavigate();
  const toggle=async(item)=>{const result=await wishlist.toggleWishlist(item.id);if(result.requiresLogin)navigate('/login');};
  return <ProductCardView product={product} wishlisted={wishlist.isWishlisted(product.id)} onToggleWishlist={toggle}/>;
}
