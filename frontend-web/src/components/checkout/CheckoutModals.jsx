import { CheckCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { CheckoutLocationMap } from './CheckoutLocationMap.jsx';

const inputClass = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs outline-none focus:border-primary';

export function CheckoutModals({ showLocationModal, showConfirmModal, onCloseLocation, onCloseConfirm, liveCoords, locationStatus, locationError, onRefreshLocation, onUseLocation, resolvingLocation, addressDraft, onAddressChange, onSaveAddress, savingAddress }) {
  return <>
    {showLocationModal && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"><div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
      <div className="flex items-center justify-between border-b border-gray-100 p-4"><div><strong className="text-sm text-dark">Lokasi Saat Ini</strong><p className="text-[9px] text-gray-400">Marker bergerak mengikuti posisi perangkat</p></div><button onClick={onCloseLocation} className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500"><X size={15}/></button></div>
      <div className="space-y-3 p-4">{locationStatus === 'loading' && !liveCoords ? <div className="grid h-56 place-items-center rounded-2xl bg-gray-100 text-center"><div><Loader2 className="mx-auto animate-spin text-primary"/><p className="mt-2 text-xs text-gray-500">Mengambil posisi GPS…</p><p className="mt-1 text-[9px] text-gray-400">Pastikan izin lokasi browser aktif.</p></div></div> : <CheckoutLocationMap coords={liveCoords} className="h-56"/>}
        {locationError && <p className="rounded-xl bg-red-50 p-3 text-[10px] text-red-600">{locationError}</p>}
        {liveCoords && <div className="grid grid-cols-2 gap-2"><div className="rounded-xl bg-gray-50 p-2.5 text-center"><span className="block text-[8px] text-gray-400">Koordinat</span><strong className="text-[10px] text-gray-700">{liveCoords.lat.toFixed(6)}, {liveCoords.lng.toFixed(6)}</strong></div><div className="rounded-xl bg-gray-50 p-2.5 text-center"><span className="block text-[8px] text-gray-400">Akurasi</span><strong className="text-[10px] text-gray-700">±{Math.round(liveCoords.accuracy || 0)} meter</strong></div></div>}
        <div className="grid grid-cols-2 gap-2"><button onClick={onRefreshLocation} disabled={resolvingLocation} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-50"><RefreshCw size={14}/> Refresh</button><button onClick={onUseLocation} disabled={!liveCoords || resolvingLocation} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-2 text-xs font-bold text-white disabled:bg-gray-200 disabled:text-gray-400">{resolvingLocation && <Loader2 size={14} className="animate-spin"/>}{resolvingLocation ? 'Mengisi alamat…' : 'Gunakan Lokasi Ini'}</button></div>
      </div>
    </div></div>}

    {showConfirmModal && liveCoords && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"><div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
      <div className="flex items-center justify-between border-b border-gray-100 p-4"><strong className="text-sm">Konfirmasi Alamat</strong><button onClick={onCloseConfirm} className="grid h-8 w-8 place-items-center rounded-full bg-gray-100"><X size={15}/></button></div>
      <form onSubmit={onSaveAddress} className="space-y-3 p-4">
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-600"><CheckCircle size={16}/> Lokasi berhasil didapatkan</div>
        <div className="grid grid-cols-2 gap-2"><input required value={addressDraft.label} onChange={(event)=>onAddressChange('label',event.target.value)} placeholder="Label alamat" className={inputClass}/><input required value={addressDraft.recipientName} onChange={(event)=>onAddressChange('recipientName',event.target.value)} placeholder="Nama penerima" className={inputClass}/></div>
        <input required inputMode="tel" value={addressDraft.phoneNumber} onChange={(event)=>onAddressChange('phoneNumber',event.target.value)} placeholder="Nomor telepon penerima" className={inputClass}/>
        <textarea required rows={3} value={addressDraft.fullAddress} onChange={(event)=>onAddressChange('fullAddress',event.target.value)} placeholder="Alamat lengkap" className={`${inputClass} resize-none`}/>
        <div className="grid grid-cols-2 gap-2"><input value={addressDraft.city} onChange={(event)=>onAddressChange('city',event.target.value)} placeholder="Kota/Kabupaten" className={inputClass}/><input inputMode="numeric" value={addressDraft.postalCode} onChange={(event)=>onAddressChange('postalCode',event.target.value)} placeholder="Kode pos" className={inputClass}/></div>
        <input value={addressDraft.landmark} onChange={(event)=>onAddressChange('landmark',event.target.value)} placeholder="Patokan (opsional)" className={inputClass}/>
        <CheckoutLocationMap coords={liveCoords} className="h-28"/>
        <label className="flex items-center gap-2 text-[10px] text-gray-500"><input type="checkbox" checked={addressDraft.isPrimary} onChange={(event)=>onAddressChange('isPrimary',event.target.checked)} className="accent-primary"/> Jadikan alamat utama</label>
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onCloseConfirm} className="min-h-11 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600">Edit Alamat</button><button disabled={savingAddress} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-white disabled:opacity-60">{savingAddress && <Loader2 size={14} className="animate-spin"/>} Simpan</button></div>
      </form>
    </div></div>}
  </>;
}
