import React, { useState, useEffect } from 'react';
import { Store, Clock, Phone } from 'lucide-react';


export function StoreCard({ store, onSelect }) {
  return (
    <div
      onClick={() => onSelect?.(store?.id)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 p-4 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect?.(store?.id);
        }
      }}
    >
      {}
      <div className="h-32 bg-orange-50 rounded-lg mb-3 overflow-hidden relative">
        {store?.image || store?.image_url ? (
          <img 
            src={store.image || store.image_url} 
            alt={store.name || 'Cabang Toko Dimsum'} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-orange-400">
            <Store size={32} className="mb-1" />
            <span className="text-[10px] font-medium text-gray-400">Dimsum Lumer Outlet</span>
          </div>
        )}
      </div>

      {}
      <div>
        <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
          {store?.name || 'Cabang Dimsum'}
        </h3>
        <p className="text-gray-500 text-xs sm:text-sm mb-3 line-clamp-2">
          {store?.address || 'Alamat cabang belum diatur.'}
        </p>
      </div>

      {}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50 mt-auto">
        <span className="flex items-center gap-1.5 line-clamp-1">
          <Clock size={13} className="text-orange-500" /> {store?.opening_hours || '09:00 - 21:00'}
        </span>
        {store?.phone && (
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <Phone size={13} className="text-orange-500" /> {store.phone}
          </span>
        )}
      </div>
    </div>
  );
}


export default function StoreContainer({ supabase, onSelectStore }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setStores(data || []);
    } catch (error) {
      console.error('Gagal memuat data toko:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;

    fetchStores();

    const storeChannel = supabase
      .channel('public:stores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'stores' },
        (payload) => {
          console.log('Perubahan realtime toko terdeteksi:', payload);
          fetchStores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(storeChannel);
    };
  }, [supabase]);

  if (loading && stores.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-gray-100 animate-pulse rounded-xl h-56 w-full" />
        ))}
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-12 bg-orange-50/50 rounded-xl border border-dashed border-orange-200 p-4">
        <Store size={36} className="mx-auto mb-2 text-orange-400" />
        <p className="text-gray-500 text-sm">Belum ada daftar cabang toko yang tersedia.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {stores.map((store) => (
        <StoreCard
          key={store.id}
          store={store}
          onSelect={onSelectStore}
        />
      ))}
    </div>
  );
}