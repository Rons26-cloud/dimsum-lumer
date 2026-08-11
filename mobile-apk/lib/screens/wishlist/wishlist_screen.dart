import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/product_service.dart';
import '../../services/supabase_service.dart';
import '../../widgets/app_state_view.dart';
import '../../widgets/product_image.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = SupabaseService.client.auth.currentUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Favorit')),
      body: user == null
          ? AppStateView(
              icon: Icons.favorite_border_rounded,
              title: 'Simpan produk pilihan Anda',
              message:
                  'Masuk agar daftar favorit tersimpan di semua perangkat.',
              actionLabel: 'Masuk / Daftar',
              onAction: () => context.push('/login'))
          : StreamBuilder<List<Map<String, dynamic>>>(
              stream: SupabaseService.client
                  .from('wishlist')
                  .stream(primaryKey: ['id']).eq('user_id', user.id),
              builder: (context, snapshot) {
                if (snapshot.hasError)
                  return const AppStateView(
                      icon: Icons.cloud_off_rounded,
                      title: 'Favorit belum dapat dimuat');
                if (!snapshot.hasData) return const AppLoadingView();
                final rows = snapshot.data!;
                if (rows.isEmpty)
                  return const AppStateView(
                      icon: Icons.favorite_border_rounded,
                      title: 'Belum ada produk favorit',
                      message:
                          'Ketuk ikon hati pada produk untuk menyimpannya.');
                return FutureBuilder<List<Map<String, dynamic>>>(
                  future: ProductService.getProductsByIds(
                      rows.map((row) => row['product_id'])),
                  builder: (context, products) {
                    if (!products.hasData) return const AppLoadingView();
                    return GridView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: .78),
                      itemCount: products.data!.length,
                      itemBuilder: (context, index) =>
                          _FavoriteCard(product: products.data![index]),
                    );
                  },
                );
              },
            ),
    );
  }
}

class _FavoriteCard extends StatelessWidget {
  final Map<String, dynamic> product;
  const _FavoriteCard({required this.product});

  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(9),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
                child: Stack(fit: StackFit.expand, children: [
              ClipRRect(
                  borderRadius: BorderRadius.circular(15),
                  child: ProductImage(product: product)),
              Positioned(
                  top: 6,
                  right: 6,
                  child: IconButton.filled(
                      style:
                          IconButton.styleFrom(backgroundColor: Colors.white),
                      tooltip: 'Hapus favorit',
                      onPressed: () => SupabaseService.client
                          .from('wishlist')
                          .delete()
                          .eq('user_id',
                              SupabaseService.client.auth.currentUser!.id)
                          .eq('product_id', product['id']),
                      icon: const Icon(Icons.favorite_rounded,
                          size: 18, color: Colors.redAccent)))
            ])),
            const SizedBox(height: 9),
            Text('${product['name'] ?? 'Dimsum'}',
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 5),
            Text(_money(product['price']),
                style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.w800))
          ])));
}

String _money(Object? value) =>
    'Rp${(num.tryParse('$value') ?? 0).toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => '.')}';
