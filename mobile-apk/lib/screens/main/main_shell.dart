import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import '../home/home_screen.dart';
import '../product/product_screen.dart';
import '../order/order_screen.dart';
import '../wishlist/wishlist_screen.dart';
import '../profile/profile_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  bool _showNavigation = true;
  double _scrollDistance = 0;
  ScrollDirection _lastDirection = ScrollDirection.idle;
  static const _pages = [
    HomeScreen(),
    ProductScreen(),
    OrderScreen(),
    WishlistScreen(),
    ProfileScreen()
  ];
  static const _icons = [
    Icons.home_outlined,
    Icons.restaurant_menu_rounded,
    Icons.receipt_long_outlined,
    Icons.favorite_border_rounded,
    Icons.person_outline_rounded
  ];
  static const _labels = ['Beranda', 'Menu', 'Pesanan', 'Favorit', 'Profil'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      extendBody: true,
      body: SafeArea(
        child: NotificationListener<UserScrollNotification>(
          onNotification: (event) {
            if (event.direction != _lastDirection) _scrollDistance = 0;
            _scrollDistance += event.metrics.pixels.abs();
            _lastDirection = event.direction;
            final atTop = event.metrics.pixels < 32;
            final atBottom = event.metrics.extentAfter < 12;
            final visible = atTop ||
                atBottom ||
                event.direction == ScrollDirection.forward ||
                !(event.direction == ScrollDirection.reverse &&
                    event.metrics.pixels > 120 &&
                    _scrollDistance >= 72);
            if (visible != _showNavigation) {
              setState(() => _showNavigation = visible);
            }
            return false;
          },
          child: IndexedStack(index: _index, children: _pages),
        ),
      ),
      bottomNavigationBar: AnimatedSlide(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        offset: _showNavigation ? Offset.zero : const Offset(0, 1.5),
        child: SafeArea(
          minimum: const EdgeInsets.fromLTRB(12, 0, 12, 8),
          child: Container(
            height: 64,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: .94),
              borderRadius: BorderRadius.circular(22),
              boxShadow: const [
                BoxShadow(
                    color: Color(0x1A000000),
                    blurRadius: 18,
                    offset: Offset(0, 6))
              ],
            ),
            child: Row(
              children: List.generate(5, (index) {
                final active = index == _index;
                final center = index == 2;
                return Expanded(
                  child: Transform.translate(
                    offset: Offset(0, center ? -10 : 0),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(22),
                      onTap: () => setState(() {
                        _index = index;
                        _showNavigation = true;
                      }),
                      child: center
                          ? _CenterItem(label: _labels[index], active: active)
                          : _NavItem(
                              icon: _icons[index],
                              label: _labels[index],
                              active: active),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  const _NavItem(
      {required this.icon, required this.label, required this.active});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon,
              size: 20,
              color: active ? const Color(0xFFFF7A00) : Colors.black87),
          const SizedBox(height: 2),
          Text(label,
              style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: active ? const Color(0xFFFF7A00) : Colors.black87)),
          const SizedBox(height: 2),
          AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              width: active ? 16 : 0,
              height: 2,
              decoration: BoxDecoration(
                  color: const Color(0xFFFF7A00),
                  borderRadius: BorderRadius.circular(2))),
        ]),
      );
}

class _CenterItem extends StatelessWidget {
  final String label;
  final bool active;
  const _CenterItem({required this.label, required this.active});
  @override
  Widget build(BuildContext context) =>
      Column(mainAxisSize: MainAxisSize.min, children: [
        AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            width: 48,
            height: 48,
            decoration: BoxDecoration(
                color:
                    active ? const Color(0xFFFF7A00) : const Color(0xFF171717),
                shape: BoxShape.circle,
                boxShadow: const [
                  BoxShadow(
                      color: Color(0x33000000),
                      blurRadius: 10,
                      offset: Offset(0, 4))
                ]),
            child: const Icon(Icons.receipt_long_outlined,
                color: Colors.white, size: 20)),
        const SizedBox(height: 1),
        Text(label,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
      ]);
}
