import { usePoint } from "../hooks/usePoint.js";
import ProfilePageHeader from "../components/profile/ProfilePageHeader.jsx";

export default function Point() {
  const { point, loading } = usePoint();
  return (
    <div>
      <ProfilePageHeader title="Poin Saya" />
      <div className="mt-2 rounded-2xl bg-gradient-to-br from-primary to-accent p-4 text-white">
      <p className="text-[10px] text-white/80">Total Poin Kamu</p>
      <p className="mt-1 text-xl font-extrabold">{loading ? "..." : point}</p>
      </div>
    </div>
  );
}
