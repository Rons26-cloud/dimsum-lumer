import { useState, useEffect } from "react";

/**
 * 1. Komponen Kartu Produk Horizontal (Desain Menyamping)
 */
export function ProductCardHorizontal({ product, onAddToCart, onViewDetail }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-3 sm:p-4 flex gap-3 sm:gap-4 transition-all duration-200 items-center group w-full">
      {/* Gambar Thumbnail Produk */}
      <div 
        className="w-24 h-24 sm:w-28 sm:h-28 bg-orange-50 rounded-xl cursor-pointer flex-shrink-0 overflow-hidden relative" 
        onClick={() => onViewDetail?.(product?.id)}
      >
        {product?.image || product?.image_url ? (
          <img 
            src={product.image || product.image_url} 
            alt={product.name || 'Menu Dimsum'} 
            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300" 
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-orange-400 rounded-xl">
            <span className="text-2xl mb-1">🥟</span>
            <span className="text-[10px] font-medium text-gray-400">Dimsum</span>
          </div>
        )}
      </div>

      {/* Informasi Detail Produk */}
      <div className="flex-1 flex flex-col justify-between h-full py-0.5 min-w-0">
        <div onClick={() => onViewDetail?.(product?.id)} className="cursor-pointer">
          <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-1 truncate group-hover:text-orange-600 transition-colors">
            {product?.name || 'Menu Dimsum'}
          </h3>
          <p className="text-gray-500 text-xs sm:text-sm mb-2 line-clamp-2 leading-relaxed">
            {product?.description || 'Lezat, lumer di mulut, dan dibuat dari bahan-bahan pilihan.'}
          </p>
        </div>

        {/* Harga & Tombol Aksi (+ Tambah) */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <span className="text-orange-600 font-bold text-xs sm:text-sm">
            Rp {Number(product?.price ?? 0).toLocaleString('id-ID')}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(product);
            }}
            className="bg-orange-600 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg hover:bg-orange-700 active:scale-95 transition-all shadow-xs font-medium cursor-pointer touch-manipulation"
          >
            + Tambah
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Komponen Utama Container Horizontal dengan Realtime & Filter Kategori
 */
export default function ProductHorizontalContainer({ supabase, categoryId, onAddToCart, onViewDetail }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });

      // Jika ada categoryId yang dipilih, filter produk berdasarkan kategori tersebut
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Gagal memuat produk horizontal:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    fetchProducts();

    // Setup Supabase Realtime Listener untuk tabel products
    const productChannel = supabase
      .channel('public:products_horizontal')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('Perubahan realtime produk horizontal terdeteksi:', payload);
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productChannel);
    };
  }, [supabase, categoryId]);

  if (loading && products.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-gray-100 animate-pulse rounded-xl h-28 w-full" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200 p-6 my-2">
        <span className="text-3xl mb-2 block">🥢</span>
        <p className="text-gray-500 text-xs sm:text-sm">Belum ada menu dimsum dalam kategori ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductCardHorizontal
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onViewDetail={onViewDetail}
        />
      ))}
    </div>
  );
}