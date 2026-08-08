import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import { getPointHistory } from "../services/pointService.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProfilePageHeader from "../components/profile/ProfilePageHeader.jsx";

export default function PointHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState(null);

  useEffect(() => { if (user) getPointHistory(user.id).then(setHistory).catch(() => setHistory([])); }, [user]);

  return (
    <div>
      <ProfilePageHeader title="Riwayat Poin" />
      {history?.length === 0 && <EmptyState title="Belum ada riwayat poin" />}
    </div>
  );
}
