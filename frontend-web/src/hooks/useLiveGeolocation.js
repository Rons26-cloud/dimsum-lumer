import { useCallback, useEffect, useRef, useState } from 'react';

const OPTIONS = { enableHighAccuracy: true, timeout: 12000, maximumAge: 2000 };
const explainError = (error) => ({ 1: 'Izin lokasi ditolak. Aktifkan izin GPS di browser.', 2: 'Sinyal GPS tidak tersedia. Coba di area terbuka.', 3: 'Pencarian lokasi terlalu lama. Tekan refresh untuk mencoba lagi.' }[error?.code] || error?.message || 'Lokasi tidak dapat diakses.');

export function getFreshLocation() {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      reject(new Error('GPS memerlukan HTTPS atau localhost.'));
      return;
    }
    if (!navigator.geolocation) {
      reject(new Error('Perangkat tidak mendukung GPS.'));
      return;
    }

    let watchId;
    const finish = (callback, value) => {
      window.clearTimeout(timeoutId);
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      callback(value);
    };
    const timeoutId = window.setTimeout(() => finish(reject, new Error('Lokasi realtime belum ditemukan. Pastikan GPS aktif lalu coba lagi.')), 15000);
    watchId = navigator.geolocation.watchPosition(
      ({ coords, timestamp }) => finish(resolve, { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, timestamp }),
      (error) => finish(reject, new Error(explainError(error))),
      { ...OPTIONS, maximumAge: 0 },
    );
  });
}

export function useLiveGeolocation() {
  const watchId = useRef(null);
  const timeoutId = useRef(null);
  const [state, setState] = useState({ coords: null, status: 'idle', error: '' });

  const clearWatch = useCallback(() => {
    if (watchId.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    if (timeoutId.current) window.clearTimeout(timeoutId.current);
    watchId.current = null;
    timeoutId.current = null;
  }, []);

  const stop = useCallback(() => { clearWatch(); setState((current) => ({ ...current, status: 'idle' })); }, [clearWatch]);

  const start = useCallback(() => {
    clearWatch();
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') { setState((current) => ({ ...current, status: 'error', error: 'GPS memerlukan HTTPS atau localhost.' })); return; }
    if (!navigator.geolocation) { setState((current) => ({ ...current, status: 'error', error: 'Perangkat tidak mendukung GPS.' })); return; }
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    const success = ({ coords, timestamp }) => { if (timeoutId.current) window.clearTimeout(timeoutId.current); setState({ status:'success', error:'', coords:{ lat:coords.latitude, lng:coords.longitude, accuracy:coords.accuracy, timestamp } }); };
    const failure = (error) => { if (!watchId.current) setState((current) => ({ ...current, status:'error', error:explainError(error) })); };
    navigator.geolocation.getCurrentPosition(success, (error) => setState((current) => ({ ...current, status:'error', error:explainError(error) })), OPTIONS);
    watchId.current = navigator.geolocation.watchPosition(success, failure, OPTIONS);
    timeoutId.current = window.setTimeout(() => setState((current) => current.coords ? current : ({ ...current, status:'error', error:'GPS belum merespons. Pastikan lokasi perangkat aktif lalu tekan refresh.' })), 13000);
  }, [clearWatch]);

  useEffect(() => clearWatch, [clearWatch]);
  return { ...state, start, stop };
}
