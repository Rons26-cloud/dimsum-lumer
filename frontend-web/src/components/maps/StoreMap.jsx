const STORE_LAT = 3.570776;
const STORE_LNG = 98.694665;

export default function StoreMap({ location = STORE_LOCATION }) {
  const latitude=Number(location?.latitude||STORE_LAT);const longitude=Number(location?.longitude||STORE_LNG);
  return <iframe title={`Peta ${location?.name||'Dimsum Lumer'}`} src={`https://www.google.com/maps?q=${latitude},${longitude}&output=embed`} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />;
}

export const STORE_LOCATION = {
  latitude: STORE_LAT,
  longitude: STORE_LNG,
  name: "Dimsum Lumer - Hongkong Fashion",
  address: "Hongkong Fashion, Jalan Sisingamangaraja, Sudirejo II, Medan Amplas, Kota Medan, Sumatera Utara 20147",
  hours: "10.00–22.00",
  deliveryArea: "Medan Amplas dan sekitarnya",
};
