import { Outlet } from "react-router-dom";

export default function AdminPreviewLayout() {
  return (
    <div className="min-h-dvh bg-gray-50">
      <Outlet />
    </div>
  );
}
