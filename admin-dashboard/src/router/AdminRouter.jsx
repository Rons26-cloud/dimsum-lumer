import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Loading from "../components/ui/Loading.jsx";
import ProtectedAdminRoute from "./ProtectedAdminRoute.jsx";
import PermissionRoute from "./PermissionRoute.jsx";

const DashboardLayout=lazy(()=>import("../layouts/DashboardLayout.jsx"));
const AuthLayout=lazy(()=>import("../layouts/AuthLayout.jsx"));
const LoginAdmin=lazy(()=>import("../pages/LoginAdmin.jsx"));
const MfaAdmin=lazy(()=>import("../pages/MfaAdmin.jsx"));
const MfaSetup=lazy(()=>import("../pages/MfaSetup.jsx"));
const MfaVerify=lazy(()=>import("../pages/MfaVerify.jsx"));
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
const MonthlyArchive=lazy(()=>import("../pages/MonthlyArchive/index.jsx"));
const Reward=lazy(()=>import("../pages/Reward/index.jsx"));
const PaymentUser=lazy(()=>import("../pages/PaymentUser/index.jsx"));
const LiveChat=lazy(()=>import("../pages/LiveChat/index.jsx"));
const AppUpdates=lazy(()=>import("../pages/AppUpdates/index.jsx"));

export default function AdminRouter() {
  return <Suspense fallback={<Loading fullscreen/>}><Routes>
    <Route element={<AuthLayout/>}>
      <Route path="/login" element={<LoginAdmin/>}/>
      <Route path="/mfa" element={<MfaAdmin/>}/>
      <Route path="/mfa/setup" element={<MfaSetup/>}/>
      <Route path="/mfa/verify" element={<MfaVerify/>}/>
    </Route>
    <Route element={<ProtectedAdminRoute><DashboardLayout/></ProtectedAdminRoute>}>
      <Route index element={<DashboardHome/>}/>
      <Route path="produk" element={<Product/>}/><Route path="kategori" element={<Category/>}/>
      <Route path="flash-sale" element={<FlashSale/>}/><Route path="promo" element={<Promo/>}/>
      <Route path="pesanan" element={<Order/>}/><Route path="pelanggan" element={<Customer/>}/>
      <Route path="member" element={<Member/>}/><Route path="lokasi-toko" element={<Store/>}/>
      <Route path="laporan-penjualan" element={<Report/>}/><Route path="statistik" element={<Statistics/>}/>
      <Route path="arsip-bulanan" element={<MonthlyArchive/>}/>
      <Route path="apk" element={<PermissionRoute allow={["superadmin"]}><Apk/></PermissionRoute>}/>
      <Route path="app-updates" element={<PermissionRoute allow={["admin", "superadmin"]}><AppUpdates/></PermissionRoute>}/>
      <Route path="pengaturan-umum" element={<Settings/>}/>
      <Route path="maintenance" element={<Maintenance/>}/>
      <Route path="akun-admin" element={<AdminAccount/>}/>
      <Route path="notifikasi" element={<Notification/>}/>
      <Route path="pusat-sistem" element={<SystemCenter/>}/>
      <Route path="banner-promo" element={<Banner/>}/><Route path="wishlist" element={<Wishlist/>}/>
      <Route path="reward" element={<Reward/>}/>
      <Route path="payment-user" element={<PaymentUser/>}/>
      <Route path="live-chat" element={<LiveChat/>}/>
      <Route path="pengaturan-map" element={<StoreMap/>}/><Route path="jam-operasional" element={<StoreHours/>}/>
      <Route path="*" element={<ComingSoon title="Halaman tidak ditemukan"/>}/>
    </Route>
  </Routes></Suspense>;
}
