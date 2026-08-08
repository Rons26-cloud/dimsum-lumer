import { Outlet } from "react-router-dom";
export default function CheckoutLayout() {
  return (
    <div className="min-h-dvh bg-gray-50">
      <main>
        <Outlet />
      </main>
    </div>
  );
}
