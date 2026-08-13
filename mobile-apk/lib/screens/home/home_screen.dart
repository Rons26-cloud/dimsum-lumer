import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/product_service.dart';
import '../../services/catalog_service.dart';
import '../../services/supabase_realtime_service.dart';
import '../../widgets/product_image.dart';

const _orange = Color(0xFFE96818);
const _dark = Color(0xFF0F172A);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final PageController _bannerController = PageController();
  int _activeBanner = 0;
  Timer? _bannerTimer;

  static const _fallbackBanners = [
    _BannerData(
      eyebrow: 'FAVORIT PELANGGAN',
      title: 'Mentai Lumer',
      subtitle: 'Creamy, gurih, dan dibuat hangat saat dipesan.',
      button: 'Pesan Sekarang',
      image: 'assets/produk/mozarella.jpg',
    ),
    _BannerData(
      eyebrow: 'PAKET HEMAT KELUARGA',
      title: 'Makin Ramai, Makin Hemat',
      subtitle: 'Pilihan lengkap untuk dinikmati bersama.',
      button: 'Lihat Promo',
      image: 'assets/produk/mix.jpg',
    ),
    _BannerData(
      eyebrow: 'STOK DI RUMAH',
      title: 'Dimsum Frozen',
      subtitle: 'Praktis disimpan, mudah disajikan kapan saja.',
      button: 'Belanja Frozen',
      image: 'assets/produk/original.jpg',
    ),
  ];

  List<_BannerData> get _banners {
    final configured = RealtimeAppConfig.instance.homeBanners;
    if (configured.isEmpty) return _fallbackBanners;
    return configured
        .map((item) => _BannerData(
              eyebrow: 'PROMO PILIHAN',
              title: '${item['title'] ?? 'Promo Dimsum Lumer'}',
              subtitle: '${item['subtitle'] ?? ''}',
              button: 'Lihat Sekarang',
              image: '${item['image_url']}',
              networkImage: true,
            ))
        .toList();
  }

  @override
  void initState() {
    super.initState();
    RealtimeAppConfig.instance.addListener(_onConfigChanged);
    _bannerTimer = Timer.periodic(const Duration(milliseconds: 4500), (_) {
      if (!_bannerController.hasClients) return;
      final next = (_activeBanner + 1) % _banners.length;
      _bannerController.animateToPage(
        next,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOutCubic,
      );
    });
  }

  void _onConfigChanged() {
    if (!mounted) return;
    if (_activeBanner >= _banners.length) _activeBanner = 0;
    setState(() {});
  }

  @override
  void dispose() {
    _bannerTimer?.cancel();
    RealtimeAppConfig.instance.removeListener(_onConfigChanged);
    _bannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: ProductService.watchProducts(),
        builder: (context, snapshot) {
          final products = snapshot.data ?? const <Map<String, dynamic>>[];
          return RefreshIndicator(
            color: _orange,
            onRefresh: () async =>
                Future<void>.delayed(const Duration(milliseconds: 500)),
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(child: _header(context)),
                const SliverToBoxAdapter(child: _SearchBox()),
                SliverToBoxAdapter(child: _heroSlider()),
                const SliverToBoxAdapter(child: _CategoryList()),
                const SliverToBoxAdapter(child: _StoreAddress()),
                const SliverToBoxAdapter(child: _FaqSection()),
                const SliverToBoxAdapter(
                  child: _SectionHeader(
                      title: 'Rekomendasi Pilihan', action: 'Lihat Semua'),
                ),
                if (snapshot.connectionState == ConnectionState.waiting &&
                    products.isEmpty)
                  const SliverToBoxAdapter(
                    child: SizedBox(
                        height: 190,
                        child: Center(
                            child: CircularProgressIndicator(color: _orange))),
                  )
                else if (products.isEmpty)
                  const SliverToBoxAdapter(child: _EmptyProducts())
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(12, 0, 12, 18),
                    sliver: SliverGrid.builder(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        mainAxisSpacing: 8,
                        crossAxisSpacing: 8,
                        childAspectRatio: .61,
                      ),
                      itemCount: products.take(12).length,
                      itemBuilder: (_, index) =>
                          _ProductCard(product: products[index]),
                    ),
                  ),
                const SliverToBoxAdapter(child: _PromoStrip()),
                const SliverToBoxAdapter(child: SizedBox(height: 105)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _header(BuildContext context) {
    return Container(
      height: 68,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFEEF0F3))),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF4E8),
              borderRadius: BorderRadius.circular(13),
            ),
            child: Image.asset('assets/logo.png', fit: BoxFit.contain),
          ),
          const SizedBox(width: 11),
          const Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Dimsum Lumer',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 16,
                        height: 1.15,
                        letterSpacing: -.2,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF202124))),
                SizedBox(height: 3),
                Text('Freshly made for you',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                        fontSize: 10.5,
                        height: 1.1,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF7B8494))),
              ],
            ),
          ),
          _HeaderAction(
            onTap: () => context.push('/cart'),
            icon: Icons.shopping_cart_outlined,
            tooltip: 'Keranjang',
          ),
          const SizedBox(width: 8),
          _HeaderAction(
            onTap: () => context.push('/notifications'),
            icon: Icons.notifications_none_rounded,
            tooltip: 'Notifikasi',
          ),
        ],
      ),
    );
  }

  Widget _heroSlider() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
      child: AspectRatio(
        aspectRatio: 16 / 7,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              PageView.builder(
                controller: _bannerController,
                itemCount: _banners.length,
                onPageChanged: (value) => setState(() => _activeBanner = value),
                itemBuilder: (_, index) => _HeroBanner(data: _banners[index]),
              ),
              Positioned(
                left: 0,
                right: 0,
                bottom: 9,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    _banners.length,
                    (index) => AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      width: _activeBanner == index ? 22 : 6,
                      height: 6,
                      margin: const EdgeInsets.symmetric(horizontal: 2.5),
                      decoration: BoxDecoration(
                        color: _activeBanner == index
                            ? Colors.white
                            : Colors.white54,
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchBox extends StatelessWidget {
  const _SearchBox();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/products'),
        child: IgnorePointer(
          child: TextField(
            readOnly: true,
            decoration: InputDecoration(
              hintText: 'Cari produk atau kategori...',
              hintStyle:
                  const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
              prefixIcon: const Icon(Icons.search_rounded,
                  size: 20, color: Color(0xFF9CA3AF)),
              suffixIcon: const Icon(Icons.tune_rounded,
                  size: 18, color: Color(0xFF9CA3AF)),
              filled: true,
              fillColor: const Color(0xFFF3F4F6),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 11),
            ),
          ),
        ),
      ),
    );
  }
}

class _HeaderAction extends StatelessWidget {
  final VoidCallback onTap;
  final IconData icon;
  final String tooltip;

  const _HeaderAction(
      {required this.onTap, required this.icon, required this.tooltip});

  @override
  Widget build(BuildContext context) => SizedBox(
        width: 40,
        height: 40,
        child: IconButton(
          onPressed: onTap,
          tooltip: tooltip,
          padding: EdgeInsets.zero,
          style: IconButton.styleFrom(
            backgroundColor: const Color(0xFFF7F8FA),
            foregroundColor: const Color(0xFF344054),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(13),
              side: const BorderSide(color: Color(0xFFE9ECF0)),
            ),
          ),
          icon: Icon(icon, size: 21),
        ),
      );
}

class _HeroBanner extends StatelessWidget {
  final _BannerData data;
  const _HeroBanner({required this.data});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        data.networkImage
            ? Image.network(data.image,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    const ColoredBox(color: Color(0xFFFFE8D1)))
            : Image.asset(data.image, fit: BoxFit.cover),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xE6000000), Color(0x88000000), Color(0x08000000)],
              stops: [0, .55, 1],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 10, 18),
          child: FractionallySizedBox(
            widthFactor: .68,
            alignment: Alignment.centerLeft,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data.eyebrow,
                    style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1)),
                const SizedBox(height: 3),
                Text(data.title,
                    maxLines: 2,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        height: 1.05,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(data.subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white70, fontSize: 8)),
                const SizedBox(height: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                      color: _orange, borderRadius: BorderRadius.circular(8)),
                  child: Text(data.button,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 8,
                          fontWeight: FontWeight.w700)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CategoryList extends StatefulWidget {
  const _CategoryList();

  @override
  State<_CategoryList> createState() => _CategoryListState();
}

class _CategoryListState extends State<_CategoryList> {
  int selected = 0;

  IconData categoryIcon(String name) {
    final value = name.toLowerCase();
    if (value.contains('goreng')) return Icons.local_fire_department_outlined;
    if (value.contains('frozen')) return Icons.ac_unit_rounded;
    if (value.contains('minum')) return Icons.local_drink_outlined;
    return Icons.soup_kitchen_outlined;
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: CatalogService.watchCategories(),
      builder: (context, snapshot) {
        final categories = snapshot.data ?? const <Map<String, dynamic>>[];
        final items = <(IconData, String)>[
          (Icons.home_rounded, 'Semua'),
          ...categories.map((item) {
            final name = '${item['name'] ?? 'Kategori'}';
            return (categoryIcon(name), name);
          })
        ];
        return SizedBox(
            height: 92,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(12, 18, 12, 2),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 9),
              itemBuilder: (_, index) {
                final active = index == selected;
                return GestureDetector(
                  onTap: () {
                    setState(() => selected = index);
                    context.push('/products');
                  },
                  child: SizedBox(
                    width: 55,
                    child: Column(
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          width: 51,
                          height: 51,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                                color:
                                    active ? _orange : const Color(0xFFF3F4F6)),
                          ),
                          child: Icon(items[index].$1,
                              size: 24,
                              color:
                                  active ? _orange : const Color(0xFF6B7280)),
                        ),
                        const SizedBox(height: 5),
                        Text(items[index].$2,
                            style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w600,
                                color: active ? _orange : _dark)),
                      ],
                    ),
                  ),
                );
              },
            ));
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String action;
  const _SectionHeader({required this.title, required this.action});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 10),
      child: Row(
        children: [
          Expanded(
              child: Text(title,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: _dark))),
          Text(action,
              style: const TextStyle(
                  fontSize: 9, fontWeight: FontWeight.w700, color: _orange)),
          const Icon(Icons.chevron_right_rounded, size: 15, color: _orange),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Map<String, dynamic> product;
  const _ProductCard({required this.product});

  String get formattedPrice {
    final value = num.tryParse('${product['price'] ?? 0}')?.round() ?? 0;
    return value
        .toString()
        .replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => '.');
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(13),
      onTap: () =>
          context.push('/products/${product['id'] ?? product['slug']}'),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: const Color(0xFFF3F4F6)),
          borderRadius: BorderRadius.circular(13),
          boxShadow: const [
            BoxShadow(
                color: Color(0x0D000000), blurRadius: 8, offset: Offset(0, 2))
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: ProductImage(product: product)),
                  Positioned(
                    right: 5,
                    top: 5,
                    child: Container(
                      width: 25,
                      height: 25,
                      decoration: const BoxDecoration(
                          color: Color(0xEEFFFFFF), shape: BoxShape.circle),
                      child: const Icon(Icons.favorite_border_rounded,
                          size: 14, color: Color(0xFF6B7280)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${product['name'] ?? 'Dimsum'}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                  fontSize: 9,
                  height: 1.35,
                  fontWeight: FontWeight.w700,
                  color: _dark),
            ),
            const Spacer(),
            Text('Rp$formattedPrice',
                maxLines: 1,
                style: const TextStyle(
                    fontSize: 9, fontWeight: FontWeight.w800, color: _dark)),
            const SizedBox(height: 2),
            Row(
              children: [
                const Icon(Icons.star_rounded,
                    size: 11, color: Color(0xFFFFC107)),
                const SizedBox(width: 2),
                Text('${product['rating'] ?? '4.8'}',
                    style: const TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF6B7280))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyProducts extends StatelessWidget {
  const _EmptyProducts();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 30),
      child: Column(
        children: [
          Icon(Icons.ramen_dining_rounded, size: 42, color: Color(0xFFFFB36B)),
          SizedBox(height: 8),
          Text('Belum ada produk tersedia.',
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _StoreAddress extends StatelessWidget {
  const _StoreAddress();

  @override
  Widget build(BuildContext context) {
    final store = RealtimeAppConfig.instance.storeInfo;
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 20, 12, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Alamat Toko',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => context.push('/store-location'),
          child: Container(
            constraints: const BoxConstraints(minHeight: 80),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: const [
                BoxShadow(
                    color: Color(0x0D000000),
                    blurRadius: 5,
                    offset: Offset(0, 1))
              ],
            ),
            child: Row(children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.map_rounded,
                    color: Color(0xFF4285F4), size: 25),
              ),
              const SizedBox(width: 12),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(
                        '${store['name'] ?? 'Dimsum Lumer - Hongkong Fashion'}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.navigation_rounded,
                          size: 12, color: Color(0xFF64748B)),
                      const SizedBox(width: 4),
                      Expanded(
                          child: Text(
                              '${store['address'] ?? 'Jalan Sisingamangaraja, Medan Amplas'}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 12, color: Color(0xFF64748B)))),
                    ]),
                  ])),
              const Icon(Icons.chevron_right_rounded,
                  size: 18, color: Color(0xFF9CA3AF)),
            ]),
          ),
        ),
      ]),
    );
  }
}

class _FaqSection extends StatefulWidget {
  const _FaqSection();
  @override
  State<_FaqSection> createState() => _FaqSectionState();
}

class _FaqSectionState extends State<_FaqSection> {
  int? open;
  static const faqs = [
    (
      'Berapa lama pengiriman?',
      'Estimasi 30–60 menit tergantung lokasi dan layanan pengiriman yang dipilih.'
    ),
    (
      'Apakah bisa custom pesanan?',
      'Bisa, tulis permintaan khusus pada kolom catatan saat checkout.'
    ),
    (
      'Apakah tersedia produk frozen?',
      'Tersedia. Pilih jenis Frozen pada detail produk untuk paket 20 Pcs siap masak.'
    ),
    (
      'Di mana lokasi tokonya?',
      'Hongkong Fashion, Jalan Sisingamangaraja, Medan Amplas, Kota Medan.'
    ),
  ];

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(12, 20, 12, 0),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Pertanyaan Umum',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          ...List.generate(faqs.length, (index) {
            final expanded = open == index;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Container(
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFF3F4F6))),
                child: Column(children: [
                  InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () => setState(() => open = expanded ? null : index),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(minHeight: 48),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 12),
                        child: Row(children: [
                          Expanded(
                              child: Text(faqs[index].$1,
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600))),
                          AnimatedRotation(
                              turns: expanded ? .5 : 0,
                              duration: const Duration(milliseconds: 200),
                              child: const Icon(
                                  Icons.keyboard_arrow_down_rounded,
                                  size: 18,
                                  color: Color(0xFF9CA3AF))),
                        ]),
                      ),
                    ),
                  ),
                  AnimatedSize(
                    duration: const Duration(milliseconds: 200),
                    child: expanded
                        ? Padding(
                            padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                            child: Align(
                                alignment: Alignment.centerLeft,
                                child: Text(faqs[index].$2,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        height: 1.65,
                                        color: Color(0xFF6B7280)))))
                        : const SizedBox.shrink(),
                  ),
                ]),
              ),
            );
          }),
        ]),
      );
}

class _PromoStrip extends StatelessWidget {
  const _PromoStrip();

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: CatalogService.watchPromos(),
      builder: (context, snapshot) {
        final promos = snapshot.data ?? const <Map<String, dynamic>>[];
        if (snapshot.hasData && promos.isEmpty) return const SizedBox.shrink();
        final promo = promos.isNotEmpty ? promos.first : null;
        return Container(
          margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
                colors: [Color(0xFFFF7A00), Color(0xFFFFA24D)]),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Row(
            children: [
              const Icon(Icons.local_offer_rounded,
                  color: Colors.white, size: 30),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${promo?['title'] ?? 'Promo pilihan'}',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w800)),
                    const SizedBox(height: 2),
                    Text(
                        '${promo?['description'] ?? 'Nikmati pilihan paket hemat Dimsum Lumer.'}',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 9)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_rounded,
                  color: Colors.white, size: 19),
            ],
          ),
        );
      },
    );
  }
}

class _BannerData {
  final String eyebrow;
  final String title;
  final String subtitle;
  final String button;
  final String image;
  final bool networkImage;

  const _BannerData({
    required this.eyebrow,
    required this.title,
    required this.subtitle,
    required this.button,
    required this.image,
    this.networkImage = false,
  });
}
