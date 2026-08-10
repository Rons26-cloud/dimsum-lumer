import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar.jsx";
import Topbar from "../components/navigation/Topbar.jsx";
import AdminBottomNav from "../components/navigation/AdminBottomNav.jsx";
import DataConnectionNotice from "../components/ui/DataConnectionNotice.jsx";
import AdminUpdateTimestamp from "../components/ui/AdminUpdateTimestamp.jsx";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="lg:flex min-h-dvh bg-[#F7F8FA]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto max-w-[1800px] p-3 pb-24 xs:p-4 xs:pb-24 lg:p-7 lg:pb-8 2xl:p-8">
          <DataConnectionNotice />
          <AdminUpdateTimestamp />
          <Outlet />
        </main>
        <AdminBottomNav />
      </div>
    </div>
  );
}
