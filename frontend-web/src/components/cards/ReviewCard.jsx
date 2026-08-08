import { useState, useEffect } from "react";
import { Star } from "lucide-react";

/**
 * 1. Komponen Kartu Ulasan (ReviewCard)
 * Menampilkan ulasan pelanggan beserta rating bintang, komentar, avatar, dan lampiran foto.
 */
export function ReviewCard({ review }) {
  // Validasi rating agar aman dalam rentang 1-5
  const rating = Math.max(1, Math.min(5, review?.rating || 5));

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-4 transition-all duration-200">
      {/* Header Ulasan: Avatar & Informasi Pengguna */}
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 bg-orange-100 rounded-full mr-3 flex items-center justify-center overflow-hidden flex-shrink-0">
          {review?.user_avatar ? (
            <img 
              src={review.user_avatar} 
              alt={review?.user_name || 'Pelanggan'} 
              className="w-full h-full object-cover" 
              loading="lazy"
            />
          ) : (
            <span className="text-orange-600 font-bold text-sm">
              {review?.user_name?.charAt(0)?.toUpperCase() || 'D'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-800 truncate">
            {review?.user_name || review?.customer_name || 'Pelanggan Setia'}
          </p>
          {/* Bintang Rating Menggunakan Lucide Star */}
          <div className="flex items-center gap-0.5 mt-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                size={13} 
                fill={i < rating ? "#FFC107" : "none"} 
                className={i < rating ? "text-amber-400" : "text-gray-200"} 
                strokeWidth={i < rating ? 0 : 1.5} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Komentar Ulasan */}
      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3">
        {review?.comment || 'Dimsumnya enak banget, lumer di mulut, pengiriman juga cepat!'}
      </p>

      {/* Lampiran Foto Ulasan (Jika Ada) */}
      {review?.images && Array.isArray(review.images) && review.images.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {review.images.map((image, index) => (
            <img 
              key={index} 
              src={image} 
              alt={`Lampiran ulasan ${index + 1}`} 
              className="w-16 h-16 object-cover rounded-lg border border-gray-100 flex-shrink-0 hover:scale-105 transition-transform cursor-pointer" 
              loading="lazy"
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 2. Komponen Container Ulasan dengan Supabase Realtime
 * Mengambil data ulasan dari tabel 'reviews' dan mendengarkan perubahan secara realtime.
 */
export default function ReviewContainer({ supabase, productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from('reviews').select('*').order('created_at', { ascending: false });

      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setReviews(data || []);
    } catch (error) {
      console.error('Gagal memuat ulasan:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    fetchReviews();

    // Setup Supabase Realtime Subscription untuk tabel reviews
    const reviewChannel = supabase
      .channel('public:reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        (payload) => {
          console.log('Perubahan realtime ulasan terdeteksi:', payload);
          fetchReviews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reviewChannel);
    };
  }, [supabase, productId]);

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-gray-100 animate-pulse rounded-xl h-28 w-full" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-orange-50/50 rounded-xl border border-dashed border-orange-200 p-4">
        <Star className="mx-auto mb-1 text-amber-400" size={28} fill="currentColor"/>
        <p className="text-gray-500 text-xs sm:text-sm">Belum ada ulasan untuk menu ini. Jadilah yang pertama memberikan ulasan!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
        />
      ))}
    </div>
  );
}
