import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/cart_service.dart';
import '../../services/product_service.dart';
import '../../services/supabase_realtime_service.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_state_view.dart';
import '../../widgets/product_image.dart';

class ProductScreen extends StatefulWidget {
  const ProductScreen({super.key});
  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  String _query = '';
  String _sort = 'popular';
  bool _availableOnly = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Semua Produk',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              Text('Pilih dimsum favoritmu',
                  style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w400,
                      color: Color(0xFF9CA3AF))),
            ],
          ),
          actions: [
            IconButton(
                onPressed: () => context.push('/cart'),
                tooltip: 'Keranjang',
                icon: const Icon(Icons.shopping_bag_outlined))
          ]),
      body: Column(children: [
        Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Column(children: [
              TextField(
                  onChanged: (value) =>
                      setState(() => _query = value.trim().toLowerCase()),
                  decoration: const InputDecoration(
                      hintText: 'Cari produk…',
                      prefixIcon: Icon(Icons.search_rounded),
                      suffixIcon: Icon(Icons.tune_rounded))),
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _sort,
                    isExpanded: true,
                    decoration: const InputDecoration(
                        contentPadding: EdgeInsets.symmetric(horizontal: 12)),
                    items: const [
                      DropdownMenuItem(
                          value: 'popular', child: Text('Paling laris')),
                      DropdownMenuItem(value: 'newest', child: Text('Terbaru')),
                      DropdownMenuItem(
                          value: 'price-low', child: Text('Harga termurah')),
                      DropdownMenuItem(
                          value: 'price-high', child: Text('Harga termahal')),
                    ],
                    onChanged: (value) =>
                        setState(() => _sort = value ?? 'popular'),
                  ),
                ),
                const SizedBox(width: 8),
                FilterChip(
                  selected: _availableOnly,
                  label: const Text('Stok tersedia'),
                  onSelected: (value) => setState(() => _availableOnly = value),
                ),
              ]),
            ])),
        Expanded(
            child: StreamBuilder<List<Map<String, dynamic>>>(
          stream: ProductService.watchProducts(),
          builder: (context, snapshot) {
            if (snapshot.hasError) {
              return const AppStateView(
                  icon: Icons.cloud_off_rounded,
                  title: 'Menu belum dapat dimuat',
                  message: 'Periksa koneksi lalu coba kembali.');
            }
            if (!snapshot.hasData) return const AppLoadingView();
            final products = snapshot.data!
                .where((product) =>
                    (!_availableOnly || _stock(product) > 0) &&
                    (_query.isEmpty ||
                        '${product['name']} ${product['slug']} ${product['description']}'
                            .toLowerCase()
                            .contains(_query)))
                .toList();
            products.sort((a, b) => switch (_sort) {
                  'price-low' => _price(a).compareTo(_price(b)),
                  'price-high' => _price(b).compareTo(_price(a)),
                  'newest' => _date(b).compareTo(_date(a)),
                  _ => _sold(b).compareTo(_sold(a)),
                });
            if (products.isEmpty) {
              return AppStateView(
                  icon: Icons.search_off_rounded,
                  title: _query.isEmpty
                      ? 'Belum ada produk'
                      : 'Produk tidak ditemukan',
                  message: _query.isEmpty
                      ? 'Menu baru akan segera hadir.'
                      : 'Coba gunakan kata pencarian lain.');
            }
            return AnimatedBuilder(
              animation: RealtimeAppConfig.instance,
              builder: (context, _) => GridView.builder(
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 110),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    childAspectRatio: .67),
                itemCount: products.length,
                itemBuilder: (_, index) =>
                    _ProductCard(product: products[index]),
              ),
            );
          },
        )),
      ]),
    );
  }
}

class _ProductCard extends StatefulWidget {
  final Map<String, dynamic> product;
  const _ProductCard({required this.product});
  @override
  State<_ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<_ProductCard> {
  bool _adding = false;

  Future<void> _add() async {
    if (_adding) return;
    if (SupabaseService.client.auth.currentUser == null) {
      await context.push('/guest-order', extra: widget.product);
      return;
    }
    setState(() => _adding = true);
    try {
      await CartService.addProduct(widget.product);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: const Text('Produk ditambahkan ke keranjang.'),
            action: SnackBarAction(
                label: 'BUKA', onPressed: () => context.push('/cart'))));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text(
                'Produk belum dapat ditambahkan. Pastikan kamu sudah masuk.')));
      }
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final storeOpen = RealtimeAppConfig.instance.isStoreOpen;
    final stock = _stock(product);
    final unavailable = stock <= 0;
    final lowStock = stock > 0 && stock <= 5;
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () =>
          context.push('/products/${product['id'] ?? product['slug']}'),
      child: Card(
        child: Padding(
            padding: const EdgeInsets.all(10),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                  child: Stack(fit: StackFit.expand, children: [
                ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: ColorFiltered(
                        colorFilter: unavailable
                            ? const ColorFilter.mode(
                                Colors.grey, BlendMode.saturation)
                            : const ColorFilter.mode(
                                Colors.transparent, BlendMode.multiply),
                        child: ProductImage(product: product))),
                if (unavailable || lowStock)
                  Positioned(
                      left: 8,
                      top: 8,
                      child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 5),
                          decoration: BoxDecoration(
                              color: unavailable
                                  ? const Color(0xFF171717)
                                  : const Color(0xFFEF4444),
                              borderRadius: BorderRadius.circular(20)),
                          child: Text(unavailable ? 'Habis' : 'Sisa $stock',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800)))),
                Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                            color: Color(0xEEFFFFFF), shape: BoxShape.circle),
                        child: const Icon(Icons.favorite_border_rounded,
                            size: 16, color: Color(0xFF6B7280)))),
              ])),
              const SizedBox(height: 8),
              Text('${product['name'] ?? 'Dimsum'}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w600, height: 1.65)),
              const Spacer(),
              Text(_money(product['price']),
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.star_rounded,
                    size: 13, color: Color(0xFFFFC107)),
                const SizedBox(width: 4),
                Expanded(
                    child: Text('${product['rating'] ?? '4.8'}',
                        style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6B7280)))),
                SizedBox(
                    width: 29,
                    height: 29,
                    child: IconButton.filled(
                        tooltip: SupabaseService.client.auth.currentUser == null
                            ? 'Pesan tanpa login'
                            : 'Tambah ke keranjang',
                        onPressed:
                            storeOpen && !unavailable && !_adding ? _add : null,
                        icon: _adding
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : Icon(
                                SupabaseService.client.auth.currentUser == null
                                    ? Icons.chat_rounded
                                    : Icons.add_shopping_cart_rounded,
                                size: 14)))
              ]),
            ])),
      ),
    );
  }
}

int _stock(Map<String, dynamic> product) =>
    num.tryParse('${product['stock'] ?? 0}')?.round() ?? 0;
num _price(Map<String, dynamic> product) =>
    num.tryParse('${product['price'] ?? 0}') ?? 0;
num _sold(Map<String, dynamic> product) =>
    num.tryParse('${product['sold_count'] ?? 0}') ?? 0;
DateTime _date(Map<String, dynamic> product) =>
    DateTime.tryParse('${product['created_at'] ?? ''}') ?? DateTime(1970);

String _money(Object? value) =>
    'Rp${(num.tryParse('$value') ?? 0).toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => '.')}';
