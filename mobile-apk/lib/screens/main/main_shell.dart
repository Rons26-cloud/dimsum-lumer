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
  static const _colors = [
    Color(0xFFE96818),
    Color(0xFFD97706),
    Color(0xFF2563EB),
    Color(0xFFE11D48),
    Color(0xFF7C3AED),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      extendBody: false,
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
        offset: _showNavigation ? Offset.zero : const Offset(0, 1),
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFECEFF3))),
          ),
          child: SafeArea(
            top: false,
            left: false,
            right: false,
            minimum: const EdgeInsets.only(bottom: 4),
            child: SizedBox(
              height: 68,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  children: List.generate(5, (index) {
                    final active = index == _index;
                    return Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => setState(() {
                            _index = index;
                            _showNavigation = true;
                          }),
                          child: _NavItem(
                              icon: _icons[index],
                              label: _labels[index],
                              active: active,
                              activeColor: _colors[index]),
                        ),
                      ),
                    );
                  }),
                ),
              ),
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
  final Color activeColor;
  const _NavItem(
      {required this.icon,
      required this.label,
      required this.active,
      required this.activeColor});
  @override
  Widget build(BuildContext context) => Semantics(
        selected: active,
        label: label,
        button: true,
        child: SizedBox.expand(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOutCubic,
              width: 40,
              height: 32,
              decoration: BoxDecoration(
                color: active
                    ? activeColor.withValues(alpha: .12)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon,
                  size: active ? 24 : 22,
                  color: active ? activeColor : const Color(0xFF667085)),
            ),
            const SizedBox(height: 3),
            Text(label,
                maxLines: 1,
                overflow: TextOverflow.fade,
                softWrap: false,
                style: TextStyle(
                    fontSize: 11,
                    height: 1.1,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                    color: active ? activeColor : const Color(0xFF667085))),
          ]),
        ),
      );
}
