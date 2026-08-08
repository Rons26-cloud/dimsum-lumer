import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Membuat ikon custom menggunakan SVG (menggantikan emoji agar konsisten)
const customerIcon = L.divIcon({
  className: 'custom-customer-marker',
  html: `
    <div style="
      background-color: #f97316; 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: white; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); 
      border: 2px solid white;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

/**
 * Komponen MarkerCustomer
 * Menampilkan pin penanda lokasi pelanggan di dalam peta Leaflet.
 */
export default function MarkerCustomer({ position, customer, children, popupContent, onClick }) {
  if (!position) return null;

  // Normalisasi posisi (mendukung array [lat, lng] maupun objek { lat, lng } / { latitude, longitude })
  let lat, lng;
  if (Array.isArray(position)) {
    [lat, lng] = position;
  } else {
    lat = position.lat ?? position.latitude;
    lng = position.lng ?? position.longitude;
  }

  if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  return (
    <Marker 
      position={[lat, lng]} 
      icon={customerIcon} 
      eventHandlers={{ 
        click: () => onClick?.(customer) 
      }}
    >
      {popupContent ? (
        <Popup>{popupContent}</Popup>
      ) : children ? (
        <Popup>{children}</Popup>
      ) : (
        <Popup>
          <div className="p-1">
            <p className="font-bold text-gray-800 text-sm">Lokasi Anda</p>
            <p className="text-xs text-gray-500 mt-0.5">Titik pengantaran pesanan dimsum.</p>
          </div>
        </Popup>
      )}
    </Marker>
  );
}