import React from 'react';
import { Popup } from 'react-leaflet';
import { Store, Phone, Clock, MapPin } from 'lucide-react';


export default function MapPopup({ data, title, description, onClose }) {
  if (title && !data) {
    return (
      <Popup onClose={onClose}>
        <div className="p-1">
          <p className="font-semibold text-sm text-gray-800">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </Popup>
    );
  }

  if (!data) return null;

  const formattedDistance = typeof data.distance === 'number' 
    ? (data.distance < 1 ? `${Math.round(data.distance * 1000)} m` : `${data.distance.toFixed(1)} km`) 
    : data.distance;

  return (
    <Popup onClose={onClose}>
      <div className="p-1 min-w-[180px]">
        {}
        <h3 className="font-bold text-base text-gray-800 mb-1 flex items-center gap-1.5">
          <Store size={16} className="text-orange-600 flex-shrink-0" />
          <span>{data.name || data.title || 'Hongkong Fashion Medan'}</span>
        </h3>

        {}
        {(data.address || data.description) && (
          <p className="text-xs text-gray-600 mb-2 leading-relaxed">
            {data.address || data.description}
          </p>
        )}

        {}
        {data.phone && (
          <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1.5">
            <Phone size={13} className="text-orange-500 flex-shrink-0" />
            <span className="font-medium">{data.phone}</span>
          </p>
        )}

        {}
        {data.opening_hours && (
          <p className="text-xs text-gray-600 mb-1.5 flex items-center gap-1.5">
            <Clock size={13} className="text-orange-500 flex-shrink-0" />
            <span>{data.opening_hours}</span>
          </p>
        )}

        {}
        {data.distance !== undefined && data.distance !== null && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-orange-600 font-semibold">
            <MapPin size={13} className="text-orange-600 flex-shrink-0" />
            <span>{formattedDistance} dari lokasi Anda</span>
          </div>
        )}
      </div>
    </Popup>
  );
}