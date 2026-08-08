/**
 * Konversi derajat ke radian
 */
const toRad = (value) => (value * Math.PI) / 180;

/**
 * Menghitung jarak (km) antara dua koordinat menggunakan formula Haversine.
 * Mendukung dua format pemanggilan:
 * 1. calculateDistance(lat1, lon1, lat2, lon2)
 * 2. calculateDistance([lat1, lon1], [lat2, lon2])
 */
export function calculateDistance(lat1OrCoord1, lon1OrCoord2, lat2, lon2) {
  let lat1, lon1, latLat2, lonLon2;

  if (Array.isArray(lat1OrCoord1) && Array.isArray(lon1OrCoord2)) {
    [lat1, lon1] = lat1OrCoord1;
    [latLat2, lonLon2] = lon1OrCoord2;
  } else {
    lat1 = lat1OrCoord1;
    lon1 = lon1OrCoord2;
    latLat2 = lat2;
    lonLon2 = lon2;
  }

  if ([lat1, lon1, latLat2, lonLon2].some((v) => typeof v !== 'number' || isNaN(v))) {
    return 0;
  }

  const R = 6371; // Radius bumi dalam kilometer
  const dLat = toRad(latLat2 - lat1);
  const dLon = toRad(lonLon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(latLat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Mencari toko terdekat dari lokasi pelanggan berdasarkan koordinat.
 */
export function findNearestStore(customerLocation, stores) {
  if (!customerLocation || !Array.isArray(stores) || stores.length === 0) {
    return null;
  }

  const custLat = customerLocation.lat ?? customerLocation[0];
  const custLng = customerLocation.lng ?? customerLocation[1];

  if (custLat === undefined || custLng === undefined) {
    return null;
  }

  let nearestStore = null;
  let minDistance = Infinity;

  stores.forEach((store) => {
    if (store.latitude === undefined || store.longitude === undefined) return;

    const distance = calculateDistance(custLat, custLng, store.latitude, store.longitude);

    if (distance < minDistance) {
      minDistance = distance;
      nearestStore = { ...store, distance };
    }
  });

  return nearestStore;
}

/**
 * Memformat jarak dalam bentuk teks yang mudah dibaca (meter atau kilometer).
 */
export function formatDistance(distanceInKm) {
  if (typeof distanceInKm !== 'number' || isNaN(distanceInKm)) {
    return '0m';
  }

  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)}m`;
  }
  return `${distanceInKm.toFixed(1)}km`;
}