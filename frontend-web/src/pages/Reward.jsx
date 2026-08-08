import { useEffect, useState } from "react";
import { getAvailableRewards } from "../services/rewardService.js";
import EmptyState from "../components/ui/EmptyState.jsx";
import ProfilePageHeader from "../components/profile/ProfilePageHeader.jsx";

export default function Reward() {
  const [rewards, setRewards] = useState(null);
  useEffect(() => { getAvailableRewards().then(setRewards).catch(() => setRewards([])); }, []);

  return (
    <div>
      <ProfilePageHeader title="Tukar Reward" />
      {rewards?.length === 0 && <EmptyState title="Belum ada reward tersedia" />}
    </div>
  );
}
