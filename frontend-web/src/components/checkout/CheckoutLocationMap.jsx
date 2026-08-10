import { useEffect } from 'react';
import { Circle, CircleMarker, MapContainer, TileLayer, useMap } from 'react-leaflet';
import MapsIcon from '../maps/MapsIcon.jsx';
import 'leaflet/dist/leaflet.css';

function FollowPosition({ position }) {
  const map = useMap();
  useEffect(() => {
    if (!position) return;
    const next=[position.lat,position.lng];
    // Jangan menggeser peta untuk perubahan GPS kecil. Peta hanya dipusatkan
    // ulang jika marker benar-benar keluar dari area tengah yang terlihat.
    if (!map.getBounds().pad(-0.3).contains(next)) map.setView(next, Math.max(map.getZoom(),16), {animate:false});
  }, [map, position?.lat, position?.lng]);
  return null;
}

export function CheckoutLocationMap({ coords, className = 'h-40' }) {
  if (!coords?.lat || !coords?.lng) return <div className={`${className} grid place-items-center rounded-2xl bg-gray-100 text-center text-xs text-gray-400`}><span className="flex flex-col items-center gap-2"><MapsIcon size={30}/><span>Menunggu koordinat GPS...</span></span></div>;
  const position = [coords.lat, coords.lng];
  return <div className={`${className} relative isolate overflow-hidden rounded-2xl border border-gray-100 bg-gray-100 shadow-inner touch-pan-y`}><MapContainer center={position} zoom={17} scrollWheelZoom={false} dragging={false} touchZoom={false} doubleClickZoom={false} boxZoom={false} keyboard={false} zoomControl={false} className="pointer-events-none h-full w-full select-none"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Circle center={position} radius={Math.max(coords.accuracy || 10, 8)} pathOptions={{ color:'#FF7A00', fillColor:'#FF7A00', fillOpacity:.12, weight:1 }}/><CircleMarker center={position} radius={8} pathOptions={{ color:'#fff', fillColor:'#FF7A00', fillOpacity:1, weight:3 }}/><FollowPosition position={coords}/></MapContainer><span className="pointer-events-none absolute bottom-2 left-1/2 z-[400] -translate-x-1/2 whitespace-nowrap rounded-full bg-gray-950/75 px-2.5 py-1 text-[8px] font-semibold text-white backdrop-blur">Peta dikunci agar halaman mudah digulir</span></div>;
}
