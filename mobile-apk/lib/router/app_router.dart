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
import '../screens/product/product_detail_screen.dart';

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
          builder: (context, state) {
            final product = state.extra;
            if (product is! Map<String, dynamic>) {
              return const _InvalidRouteScreen();
            }
            return GuestOrderScreen(product: product);
          }),
      GoRoute(
          path: '/store-location',
          builder: (context, state) => const StoreLocationScreen()),
      GoRoute(
          path: '/products',
          builder: (context, state) => const ProductScreen()),
      GoRoute(
          path: '/products/:identifier',
          builder: (context, state) => ProductDetailScreen(
              identifier: state.pathParameters['identifier'] ?? '')),
    ],
  );
}

class _InvalidRouteScreen extends StatelessWidget {
  const _InvalidRouteScreen();

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Pesanan tidak ditemukan')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.inventory_2_outlined, size: 44),
                const SizedBox(height: 12),
                const Text(
                  'Pilih produk terlebih dahulu sebelum membuat pesanan.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => context.go('/products'),
                  child: const Text('Lihat produk'),
                ),
              ],
            ),
          ),
        ),
      );
}
