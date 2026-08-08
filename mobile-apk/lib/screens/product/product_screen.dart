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
            child: TextField(
                onChanged: (value) =>
                    setState(() => _query = value.trim().toLowerCase()),
                decoration: const InputDecoration(
                    hintText: 'Cari nama atau varian dimsum...',
                    prefixIcon: Icon(Icons.search_rounded),
                    suffixIcon: Icon(Icons.tune_rounded)))),
        Expanded(
            child: StreamBuilder<List<Map<String, dynamic>>>(
          stream: ProductService.watchProducts(),
          builder: (context, snapshot) {
            if (snapshot.hasError)
              return const AppStateView(
                  icon: Icons.cloud_off_rounded,
                  title: 'Menu belum dapat dimuat',
                  message: 'Periksa koneksi lalu coba kembali.');
            if (!snapshot.hasData) return const AppLoadingView();
            final products = snapshot.data!
                .where((product) =>
                    _query.isEmpty ||
                    '${product['name']} ${product['slug']} ${product['description']}'
                        .toLowerCase()
                        .contains(_query))
                .toList();
            if (products.isEmpty)
              return AppStateView(
                  icon: Icons.search_off_rounded,
                  title: _query.isEmpty
                      ? 'Belum ada produk'
                      : 'Produk tidak ditemukan',
                  message: _query.isEmpty
                      ? 'Menu baru akan segera hadir.'
                      : 'Coba gunakan kata pencarian lain.');
            return AnimatedBuilder(
              animation: RealtimeAppConfig.instance,
              builder: (context, _) => GridView.builder(
                keyboardDismissBehavior:
                    ScrollViewKeyboardDismissBehavior.onDrag,
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 110),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: .61),
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
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: const Text('Produk ditambahkan ke keranjang.'),
            action: SnackBarAction(
                label: 'BUKA', onPressed: () => context.push('/cart'))));
    } catch (_) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text(
                'Produk belum dapat ditambahkan. Pastikan kamu sudah masuk.')));
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final storeOpen = RealtimeAppConfig.instance.isStoreOpen;
    return Card(
        child: Padding(
            padding: const EdgeInsets.all(6),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Expanded(
                  child: ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: ProductImage(product: product))),
              const SizedBox(height: 9),
              Text('${product['name'] ?? 'Dimsum'}',
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 9, fontWeight: FontWeight.w700, height: 1.3)),
              const SizedBox(height: 7),
              Row(children: [
                Expanded(
                    child: Text(
                        storeOpen ? _money(product['price']) : 'Toko tutup',
                        style: TextStyle(
                            fontSize: 9,
                            color: storeOpen
                                ? Theme.of(context).colorScheme.primary
                                : Colors.red,
                            fontWeight: FontWeight.w800))),
                SizedBox(
                    width: 29,
                    height: 29,
                    child: IconButton.filled(
                        tooltip: SupabaseService.client.auth.currentUser == null
                            ? 'Pesan tanpa login'
                            : 'Tambah ke keranjang',
                        onPressed: storeOpen && !_adding ? _add : null,
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
            ])));
  }
}

String _money(Object? value) =>
    'Rp${(num.tryParse('$value') ?? 0).toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => '.')}';
