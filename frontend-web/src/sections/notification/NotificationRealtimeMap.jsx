import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin } from "lucide-react";

let googlePromise;

function loadGoogleMaps() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return Promise.resolve(null);
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  if (!googlePromise) {
    googlePromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}`;
      script.async = true;
      script.onload = () => resolve(window.google?.maps ?? null);
      script.onerror = () => reject(new Error("Google Maps gagal dimuat."));
      document.head.appendChild(script);
    });
  }

  return googlePromise;
}

function validPoint(point) {
  const lat = Number(point?.lat);
  const lng = Number(point?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function openStreetMapUrl(point) {
  const lat = Number(point.lat);
  const lng = Number(point.lng);
  const offset = 0.012;
  const bbox = [lng - offset, lat - offset, lng + offset, lat + offset].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;
}

export default function NotificationRealtimeMap({ customer, driver, store }) {
  const element = useRef(null);
  const [mode, setMode] = useState("loading");
  const [error, setError] = useState("");
  const points = useMemo(
    () => [customer, driver, store].filter(validPoint),
    [customer, driver, store],
  );
  const fallbackPoint = driver && validPoint(driver) ? driver : points[0];

  useEffect(() => {
    let active = true;
    setError("");

    if (!points.length) {
      setMode("empty");
      return () => {
        active = false;
      };
    }

    loadGoogleMaps()
      .then((maps) => {
        if (!active) return;
        if (!maps) {
          setMode("osm");
          return;
        }
        if (!element.current) return;

        setMode("google");
        const map = new maps.Map(element.current, {
          center: driver || customer || store,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
        });
        const bounds = new maps.LatLngBounds();
        const entries = [
          [store, "Toko", "#1D1D1D"],
          [driver, "Driver", "#FF7A00"],
          [customer, "Pelanggan", "#25D366"],
        ];

        entries.forEach(([position, title, color]) => {
          if (!validPoint(position)) return;
          new maps.Marker({
            map,
            position,
            title,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 3,
            },
          });
          bounds.extend(position);
        });

        if (points.length > 1) {
          new maps.Polyline({
            map,
            path: points.slice().reverse(),
            strokeColor: "#FF7A00",
            strokeOpacity: 0.85,
            strokeWeight: 5,
          });
          map.fitBounds(bounds, 48);
        }
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason?.message || "Peta gagal dimuat.");
        setMode("osm");
      });

    return () => {
      active = false;
    };
  }, [customer?.lat, customer?.lng, driver?.lat, driver?.lng, store?.lat, store?.lng]);

  if (mode === "empty") {
    return (
      <div className="grid h-64 place-items-center rounded-3xl border border-gray-100 bg-white px-6 text-center text-xs text-gray-500">
        <div>
          <MapPin className="mx-auto mb-2 text-primary" />
          <p>Koordinat perjalanan belum tersedia.</p>
        </div>
      </div>
    );
  }

  if (mode === "osm" && fallbackPoint) {
    return (
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
        <iframe
          src={openStreetMapUrl(fallbackPoint)}
          className="h-64 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
          title="Peta perjalanan realtime"
        />
        {error ? <p className="px-4 py-2 text-center text-xs text-gray-500">{error} Menampilkan peta alternatif.</p> : null}
      </div>
    );
  }

  return <div ref={element} className="h-64 w-full rounded-3xl border border-gray-100 bg-white" aria-label="Peta perjalanan realtime" />;
}
