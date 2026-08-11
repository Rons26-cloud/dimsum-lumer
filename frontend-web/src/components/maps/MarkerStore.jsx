import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const storeIcon = L.divIcon({
  className: 'custom-store-marker',
  html: `
    <div style="
      background-color: #2563eb; 
      width: 34px; 
      height: 34px; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: white; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.25); 
      border: 2px solid white;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
        <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.79 1.1L21 9"></path>
        <path d="M12 3v6"></path>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});


export default function MarkerStore({ position, store, children, onClick }) {
  let coords = position;
  if (!coords && store) {
    const lat = store.latitude || store.lat;
    const lng = store.longitude || store.lng;
    if (lat !== undefined && lng !== undefined) {
      coords = [lat, lng];
    }
  }

  if (!coords) return null;

  let lat, lng;
  if (Array.isArray(coords)) {
    [lat, lng] = coords;
  } else {
    lat = coords.lat ?? coords.latitude;
    lng = coords.lng ?? coords.longitude;
  }

  if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  return (
    <Marker 
      position={[lat, lng]} 
      icon={storeIcon} 
      eventHandlers={{ 
        click: () => onClick?.(store) 
      }}
    >
      <Popup>
        {children ? (
          children
        ) : store ? (
          <div className="p-1">
            <p className="font-bold text-gray-800 text-sm">{store.name || 'Cabang Toko'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{store.address || 'Alamat tidak tersedia'}</p>
            {store.phone && (
              <p className="text-xs text-slate-600 mt-1 font-medium">Telp: {store.phone}</p>
            )}
          </div>
        ) : (
          <div className="p-1">
            <p className="font-bold text-gray-800 text-sm">Lokasi Toko</p>
          </div>
        )}
      </Popup>
    </Marker>
  );
}
