import { useState, useEffect } from "react";
import { Utensils, Soup, Flame, Package, Coffee, Sparkles } from "lucide-react";

// Fungsi helper pintar untuk mencocokkan ikon berdasarkan nama kategori dimsum
const getDimsumIcon = (name) => {
  const lower = name?.toLowerCase() || "";
  if (lower.includes("goreng") || lower.includes("crispy") || lower.includes("bakar")) return Flame;
  if (lower.includes("kuah") || lower.includes("soup") || lower.includes("sup")) return Soup;
  if (lower.includes("minum") || lower.includes("es") || lower.includes("drink") || lower.includes("coffee")) return Coffee;
  if (lower.includes("paket") || lower.includes("bundle") || lower.includes("combo")) return Package;
  if (lower.includes("spesial") || lower.includes("promo") || lower.includes("favorit")) return Sparkles;
  return Utensils; // Default ikon makanan/dimsum utama
};

/**
 * 1. Komponen Kartu Kategori (Mendukung Lucide Icon, URL Gambar, atau Otomatis berdasarkan nama)
 */
export function CategoryCard({ category, active, onClick }) {
  // Tentukan ikon: pakai dari props, atau pilih otomatis dari nama kategori dimsum
  const IconComponent = category?.Icon || getDimsumIcon(category?.name);
  
  const imageUrl = category?.image_url || category?.icon_url || category?.icon;
  const isImageUrl = typeof imageUrl === 'string' && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/'));

  return (
    <div
      onClick={() => onClick?.(category?.id)}
      className="group flex w-16 shrink-0 cursor-pointer flex-col items-center justify-center bg-transparent text-center transition-transform active:scale-95"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(category?.id);
        }
      }}
    >
      <div className={`mx-auto mb-1.5 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border transition-all duration-200 ${
        active ? "border-primary text-primary" : "border-gray-100 bg-white text-gray-500"
      }`}>
        {isImageUrl ? (
          <img 
            src={imageUrl} 
            alt={category.name || 'Kategori'} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : IconComponent ? (
          <IconComponent size={26} strokeWidth={active ? 2.2 : 1.8} />
        ) : <Utensils size={26} />}
      </div>

      <h3 className={`line-clamp-1 text-[9px] font-semibold transition-colors ${active ? "text-primary" : "text-gray-600"}`}>
        {category?.name || 'Kategori Dimsum'}
      </h3>

      <p className="mt-0.5 text-[8px] text-gray-400">
        {category?.product_count ?? 0} Menu
      </p>
    </div>
  );
}

/**
 * 2. Komponen Utama dengan Realtime Listener Supabase
 */
export function CategoryContainer({ supabase, onSelectCategory, activeCategoryId }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengambil data kategori beserta jumlah produknya
  const fetchCategories = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          products:products(count)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      // Format data menghitung jumlah produk
      const formattedData = (data || []).map(cat => ({
        ...cat,
        product_count: cat.products?.[0]?.count || 0
      }));

      setCategories(formattedData);
    } catch (error) {
      console.error('Gagal memuat kategori:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    fetchCategories();

    // Setup Supabase Realtime Subscription untuk tabel categories
    const categoryChannel = supabase
      .channel('public:categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        (payload) => {
          console.log('Perubahan realtime kategori terdeteksi:', payload);
          fetchCategories();
        }
      )
      .subscribe();

    // Cleanup subscription saat komponen di-unmount
    return () => {
      supabase.removeChannel(categoryChannel);
    };
  }, [supabase]);

  if (loading && categories.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="bg-gray-100 animate-pulse rounded-xl h-32" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        Belum ada kategori tersedia.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {categories.map((category) => (
        <CategoryCard 
          key={category.id} 
          category={category} 
          active={activeCategoryId === category.id}
          onClick={onSelectCategory} 
        />
      ))}
    </div>
  );
}

export default CategoryCard;

