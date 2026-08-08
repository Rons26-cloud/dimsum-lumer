import { Outlet } from "react-router-dom";

// Layout pratinjau ringan yang meniru nuansa admin dashboard, dipakai jika
// customer perlu melihat pratinjau data ala-admin (mis. status toko) dari frontend-web.
export default function AdminPreviewLayout() {
  return (
    <div className="min-h-dvh bg-gray-50">
      <Outlet />
    </div>
  );
}
