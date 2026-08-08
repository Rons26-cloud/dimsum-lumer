import React from 'react'
import { Star, User, MessageSquare } from 'lucide-react'

/**
 * Komponen ReviewList
 * Menampilkan daftar ulasan atau testimoni dari pelanggan.
 */
export default function ReviewList({ reviews = [] }) {
  // Jika belum ada ulasan sama sekali
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-6">
        <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm font-medium text-gray-600">Belum ada ulasan untuk produk ini.</p>
        <p className="text-xs text-gray-400 mt-1">Jadilah yang pertama memberikan ulasan!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, index) => {
        const rating = Number(review?.rating || 5)
        const customerName = review?.user_name || review?.name || 'Pelanggan Setia'
        const comment = review?.comment || review?.review || 'Tidak ada komentar.'
        const date = review?.created_at || review?.date || ''

        return (
          <div 
            key={review.id || index} 
            className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
          >
            {/* Bagian Header Ulasan: Avatar, Nama, & Tanggal */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0">
                  {review?.avatar ? (
                    <img 
                      src={review.avatar} 
                      alt={customerName} 
                      className="w-full h-full rounded-full object-cover" 
                      loading="lazy"
                    />
                  ) : (
                    <User size={18} />
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-800">{customerName}</h4>
                  {date && (
                    <span className="text-[11px] text-gray-400">
                      {new Date(date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Bintang Rating */}
              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/60">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-amber-700">{rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Isi Komentar / Ulasan */}
            <p className="text-sm text-gray-600 leading-relaxed pl-12">
              {comment}
            </p>
          </div>
        )
      })}
    </div>
  )
}