import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../screens/main/main_shell.dart';
import '../screens/login/login_screen.dart';
import '../screens/cart/cart_screen.dart';
import '../screens/notification/notification_screen.dart';
import '../screens/checkout/checkout_screen.dart';
import '../screens/checkout/guest_order_screen.dart';
import '../screens/store/store_location_screen.dart';
import '../screens/product/product_screen.dart';

// Routing dasar — tambahkan route product/cart/checkout/profile dst
// mengikuti folder yang sudah tersedia di lib/screens/.
class AppRouter {
  static final rootNavigatorKey = GlobalKey<NavigatorState>();
  static final GoRouter router = GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (context, state) => const MainShell()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/cart', builder: (context, state) => const CartScreen()),
      GoRoute(
          path: '/notifications',
          builder: (context, state) => const NotificationScreen()),
      GoRoute(
          path: '/checkout',
          builder: (context, state) => const CheckoutScreen()),
      GoRoute(
          path: '/guest-order',
          builder: (context, state) =>
              GuestOrderScreen(product: state.extra! as Map<String, dynamic>)),
      GoRoute(
          path: '/store-location',
          builder: (context, state) => const StoreLocationScreen()),
      GoRoute(
          path: '/products',
          builder: (context, state) => const ProductScreen()),
    ],
  );
}
