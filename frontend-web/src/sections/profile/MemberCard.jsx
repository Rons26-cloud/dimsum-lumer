import { ChevronRight, Mail, Phone } from "lucide-react";
import ProfileAvatar from "../../components/profile/ProfileAvatar.jsx";
import MemberBadge from "../../components/profile/MemberBadge.jsx";

export default function MemberCard({ profile, user, onClick }) {
  const name = profile?.full_name || user?.user_metadata?.full_name || "Pelanggan Dimsum";
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm">
      <ProfileAvatar src={profile?.avatar_url} name={name} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-base font-bold text-gray-900">{name}</strong>
          <MemberBadge level={profile?.member_level || "Bronze"} />
        </span>
        <span className="mt-1.5 flex items-center gap-1 truncate text-xs text-gray-500"><Mail size={11} />{user?.email}</span>
        <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500"><Phone size={11} />{profile?.phone || "Nomor HP belum diisi"}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-gray-400" />
    </button>
  );
}
