import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function FollowPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [map, position]);
  return null;
}

export function CheckoutLocationMap({ coords, className = 'h-40' }) {
  if (!coords?.lat || !coords?.lng) return <div className={`${className} grid place-items-center rounded-2xl bg-gray-100 text-center text-xs text-gray-400`}>Menunggu koordinat GPS…</div>;
  const position = [coords.lat, coords.lng];
  return <div className={`${className} overflow-hidden rounded-2xl border border-gray-100`}><MapContainer center={position} zoom={17} scrollWheelZoom={false} className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Circle center={position} radius={Math.max(coords.accuracy || 10, 8)} pathOptions={{ color:'#FF7A00', fillColor:'#FF7A00', fillOpacity:.12, weight:1 }}/><CircleMarker center={position} radius={8} pathOptions={{ color:'#fff', fillColor:'#FF7A00', fillOpacity:1, weight:3 }}/><FollowPosition position={coords}/></MapContainer></div>;
}
