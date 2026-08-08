import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/navigation/Sidebar.jsx";
import Topbar from "../components/navigation/Topbar.jsx";
import AdminBottomNav from "../components/navigation/AdminBottomNav.jsx";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="lg:flex min-h-dvh bg-[#F7F8FA]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-3 xs:p-4 lg:p-6 pb-24 lg:pb-6 max-w-[1600px] mx-auto">
          <Outlet />
        </main>
        <AdminBottomNav />
      </div>
    </div>
  );
}
