import 'supabase_service.dart';

class ProductService {
  static Stream<List<Map<String, dynamic>>> watchProducts() =>
      SupabaseService.client
          .from('products')
          .stream(primaryKey: ['id'])
          .eq('is_active', true)
          .order('sold_count');

  static Stream<List<Map<String, dynamic>>> watchProduct(String identifier) {
    final field =
        identifier.contains('-') && identifier.length == 36 ? 'id' : 'slug';
    return SupabaseService.client
        .from('products')
        .stream(primaryKey: ['id'])
        .eq(field, identifier)
        .eq('is_active', true)
        .limit(1);
  }

  static Future<List<Map<String, dynamic>>> getAllProducts() async {
    final data = await SupabaseService.client.from('products').select();
    return List<Map<String, dynamic>>.from(data);
  }

  static Future<List<Map<String, dynamic>>> getPopularProducts() async {
    final data = await SupabaseService.client
        .from('products')
        .select()
        .order('sold_count', ascending: false);
    return List<Map<String, dynamic>>.from(data);
  }

  static Future<List<Map<String, dynamic>>> getProductsByIds(
      Iterable<Object?> ids) async {
    final safeIds = ids
        .map((id) => '$id')
        .where((id) => id.isNotEmpty)
        .toSet()
        .take(100)
        .toList();
    if (safeIds.isEmpty) return const [];
    final data = await SupabaseService.client
        .from('products')
        .select('id,name,slug,price,image_url,is_active')
        .inFilter('id', safeIds)
        .eq('is_active', true);
    return List<Map<String, dynamic>>.from(data);
  }
}
