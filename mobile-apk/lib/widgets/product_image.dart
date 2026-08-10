import 'package:flutter/material.dart';

String productAsset(Map<String, dynamic> product) {
  final name =
      '${product['name'] ?? ''} ${product['slug'] ?? ''}'.toLowerCase();
  if (name.contains('ayam premium')) return 'assets/produk/ayampremium.jpg';
  if (name.contains('mozzarella') ||
      name.contains('mozarella') ||
      name.contains('mentai')) return 'assets/produk/mozarella.jpg';
  if (name.contains('pedas') ||
      name.contains('mercon') ||
      name.contains('spicy')) return 'assets/produk/pedas.jpg';
  if (name.contains('udang') || name.contains('shrimp'))
    return 'assets/produk/udang.jpg';
  if (name.contains('keju') || name.contains('cheese'))
    return 'assets/produk/keju.jpg';
  if (name.contains('bbq') || name.contains('barbecue'))
    return 'assets/produk/bbq.jpg';
  if (name.contains('mix') || name.contains('campur'))
    return 'assets/produk/mix.jpg';
  if (name.contains('jagung') || name.contains('corn'))
    return 'assets/produk/jagung.jpg';
  if (name.contains('jamur') || name.contains('mushroom'))
    return 'assets/produk/jamur.jpg';
  if (name.contains('sosis') || name.contains('sausage'))
    return 'assets/produk/sosis.jpg';
  if (name.contains('pangsit') || name.contains('goreng'))
    return 'assets/produk/pangsit-goreng-lumer.jpg';
  return 'assets/produk/original.jpg';
}

class ProductImage extends StatelessWidget {
  final Map<String, dynamic> product;
  final BoxFit fit;
  const ProductImage(
      {super.key, required this.product, this.fit = BoxFit.cover});
  @override
  Widget build(BuildContext context) {
    final networkUrl =
        '${product['image_url'] ?? product['image'] ?? ''}'.trim();
    final fallback = productAsset(product);
    if (Uri.tryParse(networkUrl)?.scheme == 'https') {
      return Image.network(networkUrl,
          fit: fit,
          width: double.infinity,
          height: double.infinity,
          errorBuilder: (_, __, ___) => Image.asset(fallback,
              fit: fit, width: double.infinity, height: double.infinity));
    }
    return Image.asset(fallback,
        fit: fit, width: double.infinity, height: double.infinity);
  }
}
