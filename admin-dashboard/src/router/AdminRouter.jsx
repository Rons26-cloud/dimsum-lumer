import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loading from "../components/ui/Loading.jsx";
import ProtectedAdminRoute from "./ProtectedAdminRoute.jsx";
import PermissionRoute from "./PermissionRoute.jsx";

const DashboardLayout=lazy(()=>import("../layouts/DashboardLayout.jsx"));
const AuthLayout=lazy(()=>import("../layouts/AuthLayout.jsx"));
const LoginAdmin=lazy(()=>import("../pages/LoginAdmin.jsx"));
const MfaAdmin=lazy(()=>import("../pages/MfaAdmin.jsx"));
const DashboardHome=lazy(()=>import("../pages/Dashboard/DashboardHome.jsx"));
const Product=lazy(()=>import("../pages/Product/index.jsx"));
const FlashSale=lazy(()=>import("../pages/FlashSale/index.jsx"));
const Promo=lazy(()=>import("../pages/Promo/index.jsx"));
const Banner=lazy(()=>import("../pages/Banner/index.jsx"));
const Order=lazy(()=>import("../pages/Order/index.jsx"));
const Customer=lazy(()=>import("../pages/Customer/index.jsx"));
const Member=lazy(()=>import("../pages/Member/index.jsx"));
const Store=lazy(()=>import("../pages/Store/index.jsx"));
const Report=lazy(()=>import("../pages/Report/index.jsx"));
const Apk=lazy(()=>import("../pages/APK/index.jsx"));
const Settings=lazy(()=>import("../pages/Settings/index.jsx"));
const Category=lazy(()=>import("../pages/Category/index.jsx"));
const ComingSoon=lazy(()=>import("../pages/ComingSoon.jsx"));
const Wishlist=lazy(()=>import("../pages/Wishlist/index.jsx"));
const AdminAccount=lazy(()=>import("../pages/AdminAccount/index.jsx"));
const StoreMap=lazy(()=>import("../pages/Store/MapSettings.jsx"));
const StoreHours=lazy(()=>import("../pages/Store/OperatingHours.jsx"));
const Statistics=lazy(()=>import("../pages/Report/Statistics.jsx"));
const Maintenance=lazy(()=>import("../pages/Maintenance/index.jsx"));
const Notification=lazy(()=>import("../pages/Notification/index.jsx"));
const SystemCenter=lazy(()=>import("../pages/SystemCenter/index.jsx"));

export default function AdminRouter() {
  return <Suspense fallback={<Loading fullscreen/>}><Routes>
    <Route element={<AuthLayout/>}><Route path="/login" element={<LoginAdmin/>}/></Route>
    <Route path="/mfa" element={<ProtectedAdminRoute><MfaAdmin/></ProtectedAdminRoute>}/>
    <Route element={<ProtectedAdminRoute><DashboardLayout/></ProtectedAdminRoute>}>
      <Route index element={<DashboardHome/>}/>
      <Route path="produk" element={<Product/>}/><Route path="kategori" element={<Category/>}/>
      <Route path="flash-sale" element={<FlashSale/>}/><Route path="promo" element={<Promo/>}/>
      <Route path="pesanan" element={<Order/>}/><Route path="pelanggan" element={<Customer/>}/>
      <Route path="member" element={<Member/>}/><Route path="lokasi-toko" element={<Store/>}/>
      <Route path="laporan-penjualan" element={<Report/>}/><Route path="statistik" element={<Statistics/>}/>
      <Route path="apk" element={<PermissionRoute allow={["superadmin"]}><Apk/></PermissionRoute>}/>
      <Route path="pengaturan-umum" element={<Settings/>}/>
      <Route path="maintenance" element={<Maintenance/>}/>
      <Route path="akun-admin" element={<AdminAccount/>}/>
      <Route path="notifikasi" element={<Notification/>}/>
      <Route path="pusat-sistem" element={<SystemCenter/>}/>
      <Route path="banner-promo" element={<Banner/>}/><Route path="wishlist" element={<Wishlist/>}/>
      <Route path="pengaturan-map" element={<StoreMap/>}/><Route path="jam-operasional" element={<StoreHours/>}/>
      <Route path="*" element={<ComingSoon title="Halaman tidak ditemukan"/>}/>
    </Route>
  </Routes></Suspense>;
}
