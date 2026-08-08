import { Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import CheckoutLayout from "../layouts/CheckoutLayout.jsx";
import ProfileLayout from "../layouts/ProfileLayout.jsx";

import Home from "../pages/Home.jsx";
import Product from "../pages/Product.jsx";
import ProductDetail from "../pages/ProductDetail.jsx";
import GuestOrder from "../pages/GuestOrder.jsx";
import FlashSaleDetail from "../pages/FlashSaleDetail.jsx";
import Cart from "../pages/Cart.jsx";
import Checkout from "../pages/Checkout.jsx";
import OrderTracking from "../pages/OrderTracking.jsx";
import OrderSuccess from "../pages/OrderSuccess.jsx";
import StoreLocation from "../pages/StoreLocation.jsx";
import Wishlist from "../pages/Wishlist.jsx";
import Promo from "../pages/Promo.jsx";
import Profile from "../pages/Profile.jsx";
import ProfileDetail from "../pages/ProfileDetail.jsx";
import Address from "../pages/Address.jsx";
import Point from "../pages/Point.jsx";
import PointHistory from "../pages/PointHistory.jsx";
import Reward from "../pages/Reward.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import NotFound from "../pages/NotFound.jsx";
import Orders from "../pages/Orders.jsx";
import Notification from "../pages/Notification.jsx";
import NotificationDetail from "../pages/NotificationDetail.jsx";
import Payment from "../pages/Payment.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";

export default function AppRouter() {
  return (
    <Routes>
      {/* Halaman publik / customer utama */}
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

      {/* Auth (login / register) — hanya untuk tamu, redirect kalau sudah login */}
      <Route element={<GuestRoute><AuthLayout /></GuestRoute>}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Checkout */}
      <Route element={<ProtectedRoute><CheckoutLayout /></ProtectedRoute>}>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pembayaran/:orderId" element={<Payment />} />
        <Route path="/checkout/sukses" element={<OrderSuccess />} />
      </Route>

      {/* Area profil — butuh login */}
      <Route element={<ProfileLayout />}>
        <Route path="/profil" element={<Profile />} />
        <Route path="/profil/detail" element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>} />
        <Route path="/profil/alamat" element={<ProtectedRoute><Address /></ProtectedRoute>} />
        <Route path="/profil/poin" element={<ProtectedRoute><Point /></ProtectedRoute>} />
        <Route path="/profil/riwayat-poin" element={<ProtectedRoute><PointHistory /></ProtectedRoute>} />
        <Route path="/profil/reward" element={<ProtectedRoute><Reward /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
