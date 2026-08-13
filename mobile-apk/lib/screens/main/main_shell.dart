import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import '../home/home_screen.dart';
import '../product/product_screen.dart';
import '../order/order_screen.dart';
import '../wishlist/wishlist_screen.dart';
import '../profile/profile_screen.dart';
import '../../theme/app_theme.dart';

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
      backgroundColor: AppColors.canvas,
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
        offset: _showNavigation ? Offset.zero : const Offset(0, 1),
        child: SafeArea(
            top: false,
            minimum: const EdgeInsets.fromLTRB(12, 0, 12, 8),
            child: Container(
              height: 64,
              padding: const EdgeInsets.symmetric(horizontal: 6),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: .97),
                border: Border.all(color: const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.circular(22),
                boxShadow: const [BoxShadow(color: Color(0x1F111827), blurRadius: 24, offset: Offset(0, 8))],
              ),
              child: Row(
                children: List.generate(5, (index) {
                  final active = index == _index;
                  return Expanded(
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
                        elevated: index == 2,
                        activeColor: _colors[index],
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
  final bool elevated;
  final Color activeColor;
  const _NavItem(
      {required this.icon,
      required this.label,
      required this.active,
      this.elevated = false,
      required this.activeColor});
  @override
  Widget build(BuildContext context) => Semantics(
        selected: active,
        label: label,
        button: true,
        child: SizedBox.expand(
          child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              curve: Curves.easeOutCubic,
              width: elevated ? 48 : 36,
              height: elevated ? 48 : 32,
              transform: elevated ? Matrix4.translationValues(0, -6, 0) : Matrix4.identity(),
              decoration: BoxDecoration(
                color: elevated
                    ? (active ? activeColor : activeColor.withValues(alpha: .10))
                    : (active ? activeColor.withValues(alpha: .10) : Colors.transparent),
                border: elevated ? Border.all(color: Colors.white, width: 4) : null,
                borderRadius: BorderRadius.circular(elevated ? 999 : 12),
                boxShadow: elevated ? const [BoxShadow(color: Color(0x29111827), blurRadius: 16, offset: Offset(0, 6))] : null,
              ),
              child: Icon(icon,
                  size: elevated ? 21 : 20,
                  color: elevated && active ? Colors.white : (active ? activeColor : const Color(0xFF64748B))),
            ),
            SizedBox(height: elevated ? 0 : 2),
            Text(label,
                maxLines: 1,
                overflow: TextOverflow.fade,
                softWrap: false,
                style: TextStyle(
                    fontSize: 10,
                    height: 1.1,
                    fontWeight: active ? FontWeight.w700 : FontWeight.w600,
                    color: active ? activeColor : const Color(0xFF64748B))),
            const SizedBox(height: 5),
          ]),
        ),
      );
}
