import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useRealtimeCheckout } from '../hooks/useRealtimeCheckout.js';
import { useLiveGeolocation } from '../hooks/useLiveGeolocation.js';
import { supabase } from '../supabase/client.js';
import { CheckoutHeader } from '../components/checkout/CheckoutHeader.jsx';
import { CheckoutSteps } from '../components/checkout/CheckoutSteps.jsx';
import { ReceiverSection } from '../components/checkout/ReceiverSection.jsx';
import { AddressSection } from '../components/checkout/AddressSection.jsx';
import { OrderSummarySection } from '../components/checkout/OrderSummarySection.jsx';
import { ShippingMethodSection } from '../components/checkout/ShippingMethodSection.jsx';
import { PaymentMethodSection } from '../components/checkout/PaymentMethodSection.jsx';
import { runtimeId } from '../utils/runtimeId.js';
import { CheckoutModals } from '../components/checkout/CheckoutModals.jsx';
import { useCart } from '../hooks/useCart.js';
import { useStoreStatus } from '../hooks/useStoreStatus.js';
import { VoucherSection } from '../components/checkout/VoucherSection.jsx';
import { validatePromoCode } from '../services/promoService.js';

const SHIPPING = { gojek: 15000, grab: 17000, pickup: 0 };
const EMPTY_ADDRESS = { label:'Rumah', recipientName:'', phoneNumber:'', fullAddress:'', city:'', postalCode:'', landmark:'', isPrimary:false };

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const clearLocalCart = useCart((state) => state.clearCart);
  const store = useStoreStatus();
  const { cartItems, profile, addresses, loading, error, refresh } = useRealtimeCheckout(user?.id);
  const gps = useLiveGeolocation();
  const [shippingMethod, setShippingMethodState] = useState('gojek');
  const [paymentMethod, setPaymentMethod] = useState('transfer');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [addressDraft, setAddressDraft] = useState(EMPTY_ADDRESS);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingReceiver, setSavingReceiver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [locationLookup, setLocationLookup] = useState(false);
  const [promoCode,setPromoCode]=useState('');
  const [appliedPromo,setAppliedPromo]=useState(null);
  const [promoError,setPromoError]=useState('');
  const [checkingPromo,setCheckingPromo]=useState(false);

  const selectedAddress = addresses.find((item) => item.id === selectedAddressId) || addresses.find((item) => item.is_primary) || addresses[0] || null;
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.unit_price || item.products?.price || 0) * Number(item.quantity || 0), 0), [cartItems]);
  const shippingCost = SHIPPING[shippingMethod];
  const insuranceCost = cartItems.length && shippingMethod !== 'pickup' ? 3000 : 0;
  const discount = Number(appliedPromo?.discount_amount||0);
  const totalPayment = Math.max(0, subtotal + shippingCost + insuranceCost - discount);
  const receiverName = selectedAddress?.recipient_name || profile?.full_name;
  const receiverPhone = selectedAddress?.phone_number || profile?.phone;
  const receiverValid = Boolean(receiverName?.trim() && receiverPhone?.trim());
  const effectiveCoords = selectedAddress?.latitude && selectedAddress?.longitude ? { lat:Number(selectedAddress.latitude), lng:Number(selectedAddress.longitude) } : gps.coords;
  const addressValid = Boolean(selectedAddress?.full_address && effectiveCoords?.lat && effectiveCoords?.lng);
  const canCheckout = store.isOpen && receiverValid && addressValid && cartItems.length > 0 && isAgreed && !submitting;
  const checkoutIssues = [
    !store.isOpen && 'Toko sedang tutup dan belum menerima pesanan baru',
    !receiverValid && 'Nama dan nomor penerima belum lengkap',
    !selectedAddress?.full_address && 'Alamat pengiriman belum dipilih',
    selectedAddress?.full_address && !effectiveCoords && 'Titik GPS alamat belum tersedia',
    cartItems.length === 0 && 'Keranjang masih kosong',
    !isAgreed && 'Syarat dan ketentuan belum disetujui',
  ].filter(Boolean);
  const setShippingMethod = (method) => { setShippingMethodState(method); if (method === 'pickup') setPaymentMethod('cod'); };
  const applyPromo=async()=>{setCheckingPromo(true);setPromoError('');try{setAppliedPromo(await validatePromoCode(promoCode,subtotal));}catch(reason){setAppliedPromo(null);setPromoError(reason.message||'Voucher tidak dapat digunakan.');}finally{setCheckingPromo(false);}};
  const removePromo=()=>{setAppliedPromo(null);setPromoCode('');setPromoError('');};

  const openLocation = (address = null) => {
    setEditingAddressId(address?.id || null);
    setAddressDraft(address ? { label:address.label || 'Rumah', recipientName:address.recipient_name || profile?.full_name || '', phoneNumber:address.phone_number || profile?.phone || '', fullAddress:address.full_address || '', city:address.city || '', postalCode:address.postal_code || '', landmark:address.landmark || '', isPrimary:Boolean(address.is_primary) } : { ...EMPTY_ADDRESS, recipientName:profile?.full_name || '', phoneNumber:profile?.phone || '', isPrimary:addresses.length === 0 });
    setShowLocationModal(true);
    gps.start();
  };

  const useCurrentLocation = async () => {
    if (!gps.coords) return;
    gps.stop();
    setLocationLookup(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&lat=${gps.coords.lat}&lon=${gps.coords.lng}`);
      if (!response.ok) throw new Error('Alamat lokasi tidak ditemukan');
      const location = await response.json();
      const details = location.address || {};
      setAddressDraft((current) => ({ ...current, fullAddress:location.display_name || current.fullAddress || `${gps.coords.lat.toFixed(6)}, ${gps.coords.lng.toFixed(6)}`, city:details.city || details.town || details.village || details.county || current.city, postalCode:details.postcode || current.postalCode }));
    } catch {
      setAddressDraft((current) => ({ ...current, fullAddress:current.fullAddress || `${gps.coords.lat.toFixed(6)}, ${gps.coords.lng.toFixed(6)}` }));
    } finally { setLocationLookup(false); }
    setShowLocationModal(false);
    setShowConfirmModal(true);
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    if (!user || !gps.coords) return;
    setSavingAddress(true);
    setSubmitError('');
    try {
      if (addressDraft.isPrimary) {
        const { error: primaryError } = await supabase.from('addresses').update({ is_primary: false }).eq('user_id', user.id);
        if (primaryError) throw primaryError;
      }
      const addressId = editingAddressId || runtimeId();
      const basePayload = { user_id:user.id, recipient_name:addressDraft.recipientName.trim(), phone_number:addressDraft.phoneNumber.trim(), full_address:addressDraft.fullAddress.trim(), city:addressDraft.city.trim() || null, postal_code:addressDraft.postalCode.trim() || null, label:addressDraft.label.trim(), is_primary:addressDraft.isPrimary };
      const supportsAddressGps = import.meta.env.VITE_ADDRESS_GPS_COLUMNS === 'true';
      const fullPayload = supportsAddressGps ? { ...basePayload, landmark:addressDraft.landmark.trim() || null, latitude:gps.coords.lat, longitude:gps.coords.lng } : basePayload;
      const save = (payload) => editingAddressId ? supabase.from('addresses').update(payload).eq('id', editingAddressId).eq('user_id', user.id) : supabase.from('addresses').insert({ id:addressId, ...payload });
      const { error:saveError } = await save(fullPayload);
      if (saveError) throw saveError;
      setSelectedAddressId(addressId);
      setShowConfirmModal(false);
      await refresh();
    } catch (saveError) {
      setSubmitError(saveError.message || 'Alamat gagal disimpan.');
    } finally { setSavingAddress(false); }
  };

  const deleteAddress = async (address) => {
    if (!window.confirm(`Hapus alamat “${address.label || 'Alamat'}”?`)) return;
    const { error: deleteError } = await supabase.from('addresses').delete().eq('id', address.id).eq('user_id', user.id);
    if (deleteError) setSubmitError(deleteError.message); else { if (selectedAddressId === address.id) setSelectedAddressId(null); await refresh(); }
  };

  const saveReceiver = async ({ fullName, phone }) => {
    if (!user) return;
    setSavingReceiver(true);
    setSubmitError('');
    const { error: profileError } = await supabase.from('profiles').upsert({ id:user.id, full_name:fullName.trim(), phone:phone.trim(), updated_at:new Date().toISOString() });
    setSavingReceiver(false);
    if (profileError) { setSubmitError(profileError.message); throw profileError; }
    await refresh();
  };

  const handleCheckoutOrder = async () => {
    if (!canCheckout || !user) return;
    const adminNumber = (import.meta.env.VITE_ADMIN_WA_NUMBER || '').replace(/\D/g, '');
    const needsWhatsApp = paymentMethod === 'cod' && Boolean(adminNumber);
    const whatsappWindow = needsWhatsApp ? window.open('', '_blank') : null;
    setSubmitting(true);
    setSubmitError('');
    try {
      const shippingAddress = [[selectedAddress.full_address, selectedAddress.city, selectedAddress.postal_code].filter(Boolean).join(', '), selectedAddress.landmark ? `Patokan: ${selectedAddress.landmark}` : ''].filter(Boolean).join(' — ');
      const items = cartItems.map((item) => ({ product_id:item.product_id, quantity:Math.max(1,Number(item.quantity||1)), variant:item.variant||'Original' }));
      const checkoutPayload={p_customer_lat:Number(effectiveCoords?.lat)||null,p_customer_lng:Number(effectiveCoords?.lng)||null,p_items:items,p_payment_method:paymentMethod,p_shipping_address:shippingAddress,p_shipping_cost:Number(shippingCost+insuranceCost)||0,p_shipping_method:shippingMethod,p_promo_code:appliedPromo?.code||null};
      const { data: orderResult, error: orderError } = await supabase.rpc('checkout_order_v2',checkoutPayload);
      if(orderError){console.error('Checkout RPC gagal',{code:orderError.code,message:orderError.message,details:orderError.details,hint:orderError.hint,itemCount:items.length,hasPromo:Boolean(checkoutPayload.p_promo_code)});throw orderError;}
      let parsedResult=orderResult;
      if(typeof parsedResult==='string'){try{parsedResult=JSON.parse(parsedResult);}catch{parsedResult=null;}}
      let order=Array.isArray(parsedResult)?parsedResult[0]:parsedResult?.order||parsedResult;
      if(!order?.id){
        const {data:latest,error:latestError}=await supabase.from('orders').select('id,order_code,total_amount,total,status,payment_method,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
        if(latestError)throw latestError;
        order=latest;
      }
      if(!order?.id)throw new Error('Order berhasil diproses tetapi ID pesanan tidak diterima. Silakan periksa riwayat pesanan.');
      sessionStorage.setItem('dimsum-lumer-last-order-id',order.id);

      if (needsWhatsApp && whatsappWindow) {
        const itemLines = cartItems.map((item) => `• ${item.products?.name} (${item.variant || 'Original'}) x${item.quantity}`).join('\n');
        const message = encodeURIComponent(`Halo Admin Dimsum Lumer\n\nSaya membuat pesanan *${order.order_code}*\n${itemLines}\n\nKurir: ${shippingMethod.toUpperCase()}\nPembayaran: ${paymentMethod.toUpperCase()}\nTotal: Rp${Number(order.total_amount).toLocaleString('id-ID')}\nAlamat: ${shippingAddress}\nLokasi: https://www.google.com/maps?q=${effectiveCoords.lat},${effectiveCoords.lng}`);
        whatsappWindow.location.href = `https://wa.me/${adminNumber}?text=${message}`;
      }
      clearLocalCart();
      if(paymentMethod==='cod')navigate('/checkout/sukses',{replace:true,state:{orderId:order.id,orderCode:order.order_code,total:order.total_amount}});
      else navigate(`/pembayaran/${order.id}`,{replace:true});
    } catch (checkoutError) {
      whatsappWindow?.close();
      const errorParts=[checkoutError.message,checkoutError.details,checkoutError.hint].filter((value,index,list)=>value&&list.indexOf(value)===index);
      setSubmitError(`${errorParts.join(' — ')||'Checkout gagal. Silakan coba kembali.'}${checkoutError.code?` (Kode: ${checkoutError.code})`:''}`);
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="grid min-h-dvh place-items-center bg-gray-50 text-center"><div><Loader2 className="mx-auto animate-spin text-primary" size={30}/><p className="mt-3 text-xs text-gray-500">Memuat checkout…</p></div></div>;

  return <div className="min-h-dvh bg-gray-50 pb-28 font-sans text-gray-900 sm:pb-12">
    <CheckoutHeader />
    <main className="mx-auto max-w-3xl px-3 pb-5 pt-2 xs:px-4 sm:pb-7 sm:pt-3"><div className="mb-2"><button onClick={() => navigate('/keranjang')} className="flex min-h-9 items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-primary"><ArrowLeft size={15}/> Kembali ke Keranjang</button></div>{!store.isOpen&&<div role="alert" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">Toko sedang tutup. Checkout dinonaktifkan sampai toko dibuka kembali.</div>}<CheckoutSteps/><div className="mb-5"><h1 className="text-xl font-extrabold text-dark sm:text-2xl">Checkout</h1><p className="mt-1 text-xs text-gray-500">Lengkapi data di bawah untuk melanjutkan pembayaran.</p></div>
      {error && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-[10px] text-amber-700"><span>{error}</span><button onClick={refresh} className="flex shrink-0 items-center gap-1 font-bold"><RefreshCw size={11}/> Ulangi</button></div>}
      <div className="space-y-4">
        <ReceiverSection profile={{ ...profile, phone:profile?.phone, email:user?.email }} onSave={saveReceiver} saving={savingReceiver}/>
        <AddressSection addresses={addresses} selectedAddress={selectedAddress} currentCoords={effectiveCoords} onSelect={setSelectedAddressId} onAdd={() => openLocation()} onEdit={openLocation} onDelete={deleteAddress} onOpenLocation={() => openLocation(selectedAddress)}/>
        <OrderSummarySection cartItems={cartItems} subtotal={subtotal} shippingCost={shippingCost} insuranceCost={insuranceCost} discount={discount} totalPayment={totalPayment}/>
        <VoucherSection code={promoCode} onCodeChange={setPromoCode} onApply={applyPromo} onRemove={removePromo} promo={appliedPromo} error={promoError} loading={checkingPromo}/>
        <ShippingMethodSection shippingMethod={shippingMethod} setShippingMethod={setShippingMethod}/>
        <PaymentMethodSection paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} isAgreed={isAgreed} setIsAgreed={setIsAgreed}/>
        {submitError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-600">{submitError}</p>}
        {checkoutIssues.length > 0 && <div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><strong className="text-[11px] text-amber-700">Lengkapi sebelum pembayaran:</strong><ul className="mt-1.5 space-y-1 text-[10px] text-amber-700">{checkoutIssues.map((issue) => <li key={issue}>• {issue}</li>)}</ul></div>}
        <div className="hidden items-center justify-between pt-2 sm:flex"><button onClick={() => navigate('/keranjang')} className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs font-semibold text-gray-600"><ArrowLeft size={14}/> Kembali</button><button onClick={handleCheckoutOrder} disabled={!canCheckout} className="rounded-xl bg-primary px-6 py-3 text-xs font-bold text-white shadow-lg shadow-primary/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none">{submitting ? 'Memproses…' : 'Lanjut ke Pembayaran →'}</button></div>
      </div>
    </main>
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-gray-100 bg-white/95 px-4 pb-[calc(.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden"><div className="min-w-0 flex-1"><span className="block text-[9px] text-gray-400">Total Pembayaran</span><strong className="text-sm text-primary">Rp {totalPayment.toLocaleString('id-ID')}</strong></div><button onClick={handleCheckoutOrder} disabled={!canCheckout} className="min-h-11 rounded-xl bg-primary px-5 text-xs font-bold text-white disabled:bg-gray-200 disabled:text-gray-400">{submitting ? <Loader2 size={15} className="animate-spin"/> : 'Lanjut Pembayaran'}</button></div>
    <CheckoutModals showLocationModal={showLocationModal} showConfirmModal={showConfirmModal} onCloseLocation={() => { gps.stop(); setShowLocationModal(false); }} onCloseConfirm={() => setShowConfirmModal(false)} liveCoords={gps.coords} locationStatus={gps.status} locationError={gps.error} onRefreshLocation={gps.start} onUseLocation={useCurrentLocation} resolvingLocation={locationLookup} addressDraft={addressDraft} onAddressChange={(field,value) => setAddressDraft((current) => ({...current,[field]:value}))} onSaveAddress={saveAddress} savingAddress={savingAddress}/>
  </div>;
}
