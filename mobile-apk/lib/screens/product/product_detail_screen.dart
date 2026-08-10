import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../security/safe_error.dart';
import '../../services/cart_service.dart';
import '../../services/product_service.dart';
import '../../services/supabase_realtime_service.dart';
import '../../services/supabase_service.dart';
import '../../services/wishlist_service.dart';
import '../../widgets/app_state_view.dart';
import '../../widgets/product_image.dart';

class ProductDetailScreen extends StatefulWidget {
  final String identifier;
  const ProductDetailScreen({super.key, required this.identifier});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;
  String _variant = 'Goreng Siap Makan';
  bool _adding = false;

  int _stock(Map<String, dynamic> value) =>
      num.tryParse('${value['stock'] ?? 0}')?.round() ?? 0;
  num _price(Map<String, dynamic> value) =>
      num.tryParse('${value['price'] ?? 0}') ?? 0;
  String _money(num value) =>
      'Rp${value.round().toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => '.')}';

  Future<void> _add(Map<String, dynamic> product) async {
    if (_adding) return;
    if (SupabaseService.client.auth.currentUser == null) {
      await context.push('/guest-order', extra: product);
      return;
    }
    setState(() => _adding = true);
    try {
      await CartService.addProduct(product,
          quantity: _quantity, variant: _variant);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Text('Produk ditambahkan ke keranjang.'),
          action: SnackBarAction(
              label: 'BUKA', onPressed: () => context.push('/cart'))));
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(SafeError.message(error))));
      }
    } finally {
      if (mounted) setState(() => _adding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: ProductService.watchProduct(widget.identifier),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return const Scaffold(
              body: AppStateView(
                  icon: Icons.cloud_off_rounded,
                  title: 'Produk belum dapat dimuat',
                  message: 'Periksa koneksi lalu coba kembali.'));
        }
        if (!snapshot.hasData) {
          return const Scaffold(body: AppLoadingView());
        }
        if (snapshot.data!.isEmpty) {
          return Scaffold(
              appBar: AppBar(),
              body: const AppStateView(
                  icon: Icons.inventory_2_outlined,
                  title: 'Produk tidak ditemukan',
                  message: 'Produk mungkin sudah tidak tersedia.'));
        }
        return _content(snapshot.data!.first);
      },
    );
  }

  Widget _content(Map<String, dynamic> product) {
    final stock = _stock(product);
    final basePrice = _price(product);
    final frozenPrice =
        num.tryParse('${product['frozen_price'] ?? ''}') ?? basePrice;
    final selectedPrice = _variant == 'Frozen 20 Pcs' ? frozenPrice : basePrice;
    final canOrder = stock > 0 && RealtimeAppConfig.instance.isStoreOpen;
    final name = '${product['name'] ?? 'Dimsum'}';
    final lowerName = name.toLowerCase();
    final ingredient = lowerName.contains('udang')
        ? 'Udang Segar'
        : lowerName.contains('moza') ||
                lowerName.contains('mentai') ||
                lowerName.contains('keju')
            ? 'Ayam, Mozarella'
            : 'Ayam Premium';

    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          pinned: true,
          expandedHeight: 330,
          leading: IconButton.filledTonal(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back_rounded)),
          actions: [
            IconButton.filledTonal(
                onPressed: () => context.push('/cart'),
                icon: const Icon(Icons.shopping_bag_outlined)),
            const SizedBox(width: 8),
          ],
          flexibleSpace: FlexibleSpaceBar(
              background: Hero(
                  tag: 'product-${product['id']}',
                  child: ProductImage(product: product))),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 120),
          sliver: SliverList.list(children: [
            Row(children: [
              Expanded(
                  child: Text(name,
                      style: const TextStyle(
                          fontSize: 23, fontWeight: FontWeight.w900))),
              _FavoriteButton(productId: '${product['id']}'),
            ]),
            const SizedBox(height: 6),
            Row(children: [
              const Icon(Icons.star_rounded,
                  size: 17, color: Color(0xFFFFC107)),
              Text(
                  ' ${product['rating'] ?? '4.8'}  •  ${product['sold_count'] ?? 0} terjual',
                  style: const TextStyle(fontSize: 12, color: Colors.black54)),
            ]),
            const SizedBox(height: 14),
            Text(_money(basePrice),
                style: const TextStyle(
                    fontSize: 20,
                    color: Color(0xFFFF7A00),
                    fontWeight: FontWeight.w900)),
            if ('${product['description'] ?? ''}'.trim().isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('${product['description']}',
                  style: const TextStyle(height: 1.6, color: Colors.black54)),
            ],
            const SizedBox(height: 18),
            Row(children: [
              Expanded(
                  child:
                      _Info(icon: Icons.restaurant_rounded, text: ingredient)),
              const SizedBox(width: 8),
              const Expanded(
                  child: _Info(
                      icon: Icons.shield_outlined, text: 'Tanpa Pengawet')),
              const SizedBox(width: 8),
              const Expanded(
                  child: _Info(
                      icon: Icons.ac_unit_rounded, text: 'Simpan di Freezer')),
            ]),
            const SizedBox(height: 22),
            const Text('Pilih Jenis',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            _variantTile('Goreng Siap Makan', 'Box', basePrice,
                Icons.inventory_2_outlined),
            const SizedBox(height: 8),
            _variantTile(
                'Frozen 20 Pcs', '20 Pcs', frozenPrice, Icons.ac_unit_rounded),
            const SizedBox(height: 18),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(18)),
              child: Row(children: [
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Jumlah',
                      style: TextStyle(fontSize: 11, color: Colors.black45)),
                  Row(children: [
                    IconButton.filledTonal(
                        onPressed: _quantity > 1
                            ? () => setState(() => _quantity--)
                            : null,
                        icon: const Icon(Icons.remove, size: 17)),
                    Text('$_quantity',
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                    IconButton.filledTonal(
                        onPressed: _quantity < stock
                            ? () => setState(() => _quantity++)
                            : null,
                        icon: const Icon(Icons.add, size: 17)),
                  ])
                ]),
                const Spacer(),
                Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                  const Text('Total Harga',
                      style: TextStyle(fontSize: 11, color: Colors.black45)),
                  Text(_money(selectedPrice * _quantity),
                      style: const TextStyle(
                          fontSize: 18,
                          color: Color(0xFFFF7A00),
                          fontWeight: FontWeight.w900)),
                ])
              ]),
            ),
          ]),
        )
      ]),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.all(12),
        child: FilledButton.icon(
          onPressed: canOrder && !_adding ? () => _add(product) : null,
          icon: _adding
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white))
              : Icon(SupabaseService.client.auth.currentUser == null
                  ? Icons.chat_rounded
                  : Icons.add_shopping_cart_rounded),
          label: Text(!RealtimeAppConfig.instance.isStoreOpen
              ? 'Toko sedang tutup'
              : stock <= 0
                  ? 'Stok habis'
                  : SupabaseService.client.auth.currentUser == null
                      ? 'Pesan langsung via WhatsApp'
                      : 'Tambah ke keranjang'),
          style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
        ),
      ),
    );
  }

  Widget _variantTile(String value, String unit, num price, IconData icon) {
    final active = _variant == value;
    return InkWell(
      onTap: () => setState(() => _variant = value),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
            color: active ? const Color(0xFFFFF4E8) : Colors.white,
            border: Border.all(
                color:
                    active ? const Color(0xFFFF7A00) : const Color(0xFFE5E7EB)),
            borderRadius: BorderRadius.circular(16)),
        child: Row(children: [
          Icon(icon, color: const Color(0xFFFF7A00)),
          const SizedBox(width: 12),
          Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                Text(value,
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                Text('${_money(price)} / $unit',
                    style:
                        const TextStyle(fontSize: 11, color: Colors.black54)),
              ])),
          if (active) const Icon(Icons.check_circle, color: Color(0xFFFF7A00)),
        ]),
      ),
    );
  }
}

class _Info extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Info({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(14)),
      child: Column(children: [
        Icon(icon, size: 20, color: const Color(0xFFFF7A00)),
        const SizedBox(height: 5),
        Text(text,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700)),
      ]));
}

class _FavoriteButton extends StatelessWidget {
  final String productId;
  const _FavoriteButton({required this.productId});
  @override
  Widget build(BuildContext context) {
    if (SupabaseService.client.auth.currentUser == null) {
      return IconButton.outlined(
          onPressed: () => context.push('/login'),
          icon: const Icon(Icons.favorite_border_rounded));
    }
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: WishlistService.watchCurrent(),
      builder: (context, snapshot) {
        final favorite = (snapshot.data ?? const [])
            .any((item) => '${item['product_id']}' == productId);
        return IconButton.outlined(
          onPressed: () async {
            try {
              await WishlistService.setFavorite(productId, !favorite);
            } catch (error) {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(SafeError.message(error))));
              }
            }
          },
          icon: Icon(favorite
              ? Icons.favorite_rounded
              : Icons.favorite_border_rounded),
          color: favorite ? Colors.red : null,
        );
      },
    );
  }
}
