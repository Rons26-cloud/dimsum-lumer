import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/cart_service.dart';
import '../../services/product_service.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_state_view.dart';
import '../../widgets/product_image.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = SupabaseService.client.auth.currentUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Keranjang')),
      body: user == null
          ? AppStateView(
              icon: Icons.lock_outline_rounded,
              title: 'Masuk untuk membuka keranjang',
              message:
                  'Keranjang akan tersimpan dan tersinkron di semua perangkat.',
              actionLabel: 'Masuk / Daftar',
              onAction: () => context.push('/login'))
          : StreamBuilder<List<Map<String, dynamic>>>(
              stream: CartService.watchCurrentCart(),
              builder: (context, snapshot) {
                if (snapshot.hasError)
                  return const AppStateView(
                      icon: Icons.cloud_off_rounded,
                      title: 'Keranjang belum dapat dimuat',
                      message: 'Periksa koneksi lalu coba kembali.');
                if (!snapshot.hasData) return const AppLoadingView();
                final rows = snapshot.data!;
                if (rows.isEmpty)
                  return AppStateView(
                      icon: Icons.shopping_bag_outlined,
                      title: 'Keranjang masih kosong',
                      message:
                          'Pilih dimsum favorit dan tambahkan ke keranjang.',
                      actionLabel: 'Lihat menu',
                      onAction: () => context.pop());
                return FutureBuilder<List<Map<String, dynamic>>>(
                  future: ProductService.getProductsByIds(
                      rows.map((row) => row['product_id']).toList()),
                  builder: (context, productsSnapshot) {
                    if (!productsSnapshot.hasData)
                      return const AppLoadingView();
                    final products = {
                      for (final product in productsSnapshot.data!)
                        '${product['id']}': product
                    };
                    final total = rows.fold<num>(
                        0,
                        (sum, row) =>
                            sum +
                            ((num.tryParse('${row['unit_price']}') ??
                                    num.tryParse(
                                        '${products['${row['product_id']}']?['price']}') ??
                                    0) *
                                (int.tryParse('${row['quantity']}') ?? 1)));
                    return Column(children: [
                      Expanded(
                          child: ListView.separated(
                              padding: const EdgeInsets.all(16),
                              itemCount: rows.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 10),
                              itemBuilder: (context, index) {
                                final row = rows[index];
                                final product =
                                    products['${row['product_id']}'] ??
                                        <String, dynamic>{};
                                final quantity =
                                    int.tryParse('${row['quantity']}') ?? 1;
                                final stock =
                                    num.tryParse('${product['stock'] ?? 0}')
                                            ?.round() ??
                                        0;
                                return Card(
                                    child: Padding(
                                        padding: const EdgeInsets.all(10),
                                        child: Row(children: [
                                          ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(14),
                                              child: SizedBox(
                                                  width: 72,
                                                  height: 72,
                                                  child: ProductImage(
                                                      product: product))),
                                          const SizedBox(width: 12),
                                          Expanded(
                                              child: Column(
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                Text(
                                                    '${product['name'] ?? 'Produk'}',
                                                    maxLines: 2,
                                                    overflow:
                                                        TextOverflow.ellipsis,
                                                    style: const TextStyle(
                                                        fontWeight:
                                                            FontWeight.w700)),
                                                const SizedBox(height: 4),
                                                Text(
                                                    '${row['variant'] ?? 'Original'}',
                                                    style: Theme.of(context)
                                                        .textTheme
                                                        .bodySmall),
                                                if (stock <= 0)
                                                  const Padding(
                                                      padding: EdgeInsets.only(
                                                          top: 4),
                                                      child: Text('Stok habis',
                                                          style: TextStyle(
                                                              fontSize: 10,
                                                              color: Colors.red,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w700))),
                                                const SizedBox(height: 9),
                                                Row(children: [
                                                  _QuantityButton(
                                                      icon: Icons.remove,
                                                      onTap: () => CartService
                                                          .updateQuantity(
                                                              '${row['id']}',
                                                              quantity - 1)),
                                                  SizedBox(
                                                      width: 34,
                                                      child: Text('$quantity',
                                                          textAlign:
                                                              TextAlign.center,
                                                          style: const TextStyle(
                                                              fontWeight:
                                                                  FontWeight
                                                                      .w700))),
                                                  _QuantityButton(
                                                      icon: Icons.add,
                                                      onTap: stock <= 0 ||
                                                              quantity >= stock
                                                          ? null
                                                          : () => CartService
                                                              .updateQuantity(
                                                                  '${row['id']}',
                                                                  quantity +
                                                                      1)),
                                                ])
                                              ])),
                                          IconButton(
                                              tooltip: 'Hapus',
                                              onPressed: () =>
                                                  CartService.removeItem(
                                                      '${row['id']}'),
                                              icon: const Icon(
                                                  Icons.delete_outline_rounded,
                                                  color: Colors.redAccent)),
                                        ])));
                              })),
                      SafeArea(
                          top: false,
                          child: Container(
                              padding:
                                  const EdgeInsets.fromLTRB(20, 16, 20, 18),
                              decoration: const BoxDecoration(
                                  color: Colors.white,
                                  border: Border(
                                      top: BorderSide(
                                          color: Color(0xFFEFE8E2)))),
                              child: Column(children: [
                                Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text('Total sementara'),
                                      Text(_money(total),
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleLarge)
                                    ]),
                                const SizedBox(height: 12),
                                SizedBox(
                                    width: double.infinity,
                                    child: FilledButton.icon(
                                        onPressed: rows.any((row) {
                                          final product = products[
                                                  '${row['product_id']}'] ??
                                              const <String, dynamic>{};
                                          final stock = num.tryParse(
                                                      '${product['stock'] ?? 0}')
                                                  ?.round() ??
                                              0;
                                          final quantity = int.tryParse(
                                                  '${row['quantity']}') ??
                                              1;
                                          return stock <= 0 || quantity > stock;
                                        })
                                            ? null
                                            : () => context.push('/checkout'),
                                        icon: const Icon(Icons.payment_rounded,
                                            size: 18),
                                        label:
                                            const Text('Lanjut ke Checkout')))
                              ]))),
                    ]);
                  },
                );
              },
            ),
    );
  }
}

class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _QuantityButton({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) => SizedBox(
      width: 30,
      height: 30,
      child: IconButton.filledTonal(
          padding: EdgeInsets.zero,
          onPressed: onTap,
          icon: Icon(icon, size: 16)));
}

String _money(num value) =>
    'Rp${value.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => '.')}';
