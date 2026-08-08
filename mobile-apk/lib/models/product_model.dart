class ProductModel {
  final String id;
  final String name;
  final String slug;
  final num price;
  final String? imageUrl;
  final String? description;

  ProductModel({
    required this.id,
    required this.name,
    required this.slug,
    required this.price,
    this.imageUrl,
    this.description,
  });

  factory ProductModel.fromMap(Map<String, dynamic> map) => ProductModel(
        id: map['id'].toString(),
        name: map['name'] ?? '',
        slug: map['slug'] ?? '',
        price: map['price'] ?? 0,
        imageUrl: map['image_url'],
        description: map['description'],
      );
}
