import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { getAddresses } from "../services/addressService.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProfilePageHeader from "../components/profile/ProfilePageHeader.jsx";

export default function Address() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState(null);

  useEffect(() => { if (user) getAddresses(user.id).then(setAddresses).catch(() => setAddresses([])); }, [user]);

  return (
    <div>
      <ProfilePageHeader title="Alamat Saya" />
      <div className="pt-2">
      {addresses?.length === 0 && <EmptyState title="Belum ada alamat tersimpan" />}
      <div className="space-y-2">
        {addresses?.map((a) => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-3 text-sm">{a.full_address}</div>
        ))}
      </div>
      </div>
    </div>
  );
}
