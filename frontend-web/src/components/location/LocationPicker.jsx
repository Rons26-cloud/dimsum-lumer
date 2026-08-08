import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

/**
 * Komponen LocationPicker / LocationSelector
 * Mendeteksi lokasi pengguna via GPS dan menampilkan informasi lokasi aktif.
 */
export default function LocationPicker({ supabase, onLocationChange }) {
  const [currentLocation, setCurrentLocation] = useState({
    address: 'Memuat lokasi Anda...',
    latitude: null,
    longitude: null,
  });
  const [loading, setLoading] = useState(false);
  const [nearbyStores, setNearbyStores] = useState([]);

  // Fungsi untuk mendeteksi lokasi menggunakan Geolocation API browser
  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung deteksi lokasi (Geolocation).');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse Geocoding menggunakan Nominatim OpenStreetMap untuk mengubah koordinat jadi teks alamat
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const addressText = data.display_name || `${latitude}, ${longitude}`;

          const newLocation = {
            address: addressText,
            latitude,
            longitude,
          };

          setCurrentLocation(newLocation);
          onLocationChange?.(newLocation);

          // Cari toko terdekat dari database Supabase jika supabase tersedia
          if (supabase) {
            fetchNearestStore(latitude, longitude);
          }
        } catch (error) {
          console.error('Gagal mengambil nama alamat:', error);
          const fallbackLocation = {
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
          };
          setCurrentLocation(fallbackLocation);
          onLocationChange?.(fallbackLocation);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Gagal mendeteksi GPS:', error.message);
        setLoading(false);
        alert('Gagal mendeteksi lokasi. Pastikan izin GPS telah diaktifkan.');
        setCurrentLocation(prev => ({ ...prev, address: 'Lokasi tidak diizinkan / Gagal mendeteksi' }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  // Fungsi untuk mengambil daftar toko dari Supabase
  const fetchNearestStore = async (lat, lon) => {
    try {
      const { data, error } = await supabase.from('stores').select('*');
      if (error) throw error;

      // Menyimpan data toko terdekat (dapat dikembangkan menggunakan formula Haversine jika diperlukan perhitungan jarak presisi)
      setNearbyStores(data || []);
    } catch (err) {
      console.error('Gagal memuat daftar toko terdekat:', err.message);
    }
  };

  useEffect(() => {
    // Deteksi lokasi otomatis saat komponen pertama kali dimuat
    detectUserLocation();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 flex-shrink-0">
          <MapPin size={18}/>
        </div>
        <div className="overflow-hidden">
          <p className="text-xs text-gray-400 font-medium">Lokasi Pengiriman / Outlet</p>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {loading ? 'Mendeteksi lokasi...' : currentLocation.address}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={detectUserLocation}
        disabled={loading}
        className="bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-semibold px-3 py-2 rounded-lg transition-all flex-shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer touch-manipulation"
      >
        {loading ? 'Mencari...' : 'Ubah / GPS'}
      </button>
    </div>
  );
}
