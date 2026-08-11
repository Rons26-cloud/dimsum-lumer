import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import Loading from "../components/ui/Loading.jsx";

import MainLayout from "../layouts/MainLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import CheckoutLayout from "../layouts/CheckoutLayout.jsx";
import ProfileLayout from "../layouts/ProfileLayout.jsx";

const Home=lazy(()=>import("../pages/Home.jsx"));
const Product=lazy(()=>import("../pages/Product.jsx"));
const ProductDetail=lazy(()=>import("../pages/ProductDetail.jsx"));
const GuestOrder=lazy(()=>import("../pages/GuestOrder.jsx"));
const FlashSaleDetail=lazy(()=>import("../pages/FlashSaleDetail.jsx"));
const Cart=lazy(()=>import("../pages/Cart.jsx"));
const Checkout=lazy(()=>import("../pages/Checkout.jsx"));
const OrderTracking=lazy(()=>import("../pages/OrderTracking.jsx"));
const OrderSuccess=lazy(()=>import("../pages/OrderSuccess.jsx"));
const StoreLocation=lazy(()=>import("../pages/StoreLocation.jsx"));
const Wishlist=lazy(()=>import("../pages/Wishlist.jsx"));
const Promo=lazy(()=>import("../pages/Promo.jsx"));
const Profile=lazy(()=>import("../pages/Profile.jsx"));
const ProfileDetail=lazy(()=>import("../pages/ProfileDetail.jsx"));
const ProfileInformation=lazy(()=>import("../pages/ProfileInformation.jsx"));
const Address=lazy(()=>import("../pages/Address.jsx"));
const Point=lazy(()=>import("../pages/Point.jsx"));
const PointHistory=lazy(()=>import("../pages/PointHistory.jsx"));
const Reward=lazy(()=>import("../pages/Reward.jsx"));
const Login=lazy(()=>import("../pages/Login.jsx"));
const Register=lazy(()=>import("../pages/Register.jsx"));
const ResetPassword=lazy(()=>import("../pages/ResetPassword.jsx"));
const ForgotPassword=lazy(()=>import("../pages/ForgotPassword.jsx"));
const NotFound=lazy(()=>import("../pages/NotFound.jsx"));
const Orders=lazy(()=>import("../pages/Orders.jsx"));
const Notification=lazy(()=>import("../pages/Notification.jsx"));
const NotificationDetail=lazy(()=>import("../pages/NotificationDetail.jsx"));
const NotificationSettings=lazy(()=>import("../pages/NotificationSettings.jsx"));
const Payment=lazy(()=>import("../pages/Payment.jsx"));

import ProtectedRoute from "./ProtectedRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";

export default function AppRouter() {
  return (
    <Suspense fallback={<Loading fullscreen text="Menyiapkan halaman…"/>}><Routes>
      {}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/produk" element={<Product />} />
        <Route path="/produk/:slug" element={<ProductDetail />} />
        <Route path="/pesan-whatsapp" element={<GuestOrder />} />
        <Route path="/flash-sale/:saleId" element={<ProtectedRoute><FlashSaleDetail /></ProtectedRoute>} />
        <Route path="/keranjang" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/lokasi-toko" element={<StoreLocation />} />
        <Route path="/promo" element={<Promo />} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/lacak-pesanan/:orderId" element={<OrderTracking />} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
      </Route>

      <Route path="/notifikasi" element={<ProtectedRoute><Notification /></ProtectedRoute>} />
      <Route path="/notifikasi/:notificationId" element={<ProtectedRoute><NotificationDetail /></ProtectedRoute>} />

      {}
      <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {}
      <Route element={<ProtectedRoute><CheckoutLayout /></ProtectedRoute>}>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pembayaran/:orderId" element={<Payment />} />
        <Route path="/checkout/sukses" element={<OrderSuccess />} />
      </Route>

      {}
      <Route element={<ProfileLayout />}>
        <Route path="/profil" element={<Profile />} />
        <Route path="/profil/detail" element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>} />
        <Route path="/profil/informasi/:section" element={<ProfileInformation />} />
        <Route path="/profil/alamat" element={<ProtectedRoute><Address /></ProtectedRoute>} />
        <Route path="/profil/poin" element={<ProtectedRoute><Point /></ProtectedRoute>} />
        <Route path="/profil/riwayat-poin" element={<ProtectedRoute><PointHistory /></ProtectedRoute>} />
        <Route path="/profil/reward" element={<ProtectedRoute><Reward /></ProtectedRoute>} />
        <Route path="/profil/pengaturan-notifikasi" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes></Suspense>
  );
}
