import 'supabase_service.dart';

class WishlistService {
  static String? get _userId => SupabaseService.client.auth.currentUser?.id;

  static Stream<List<Map<String, dynamic>>> watchCurrent() {
    final userId = _userId;
    if (userId == null) return const Stream.empty();
    return SupabaseService.client
        .from('wishlist')
        .stream(primaryKey: ['user_id', 'product_id']).eq('user_id', userId);
  }

  static Future<void> setFavorite(String productId, bool favorite) async {
    final userId = _userId;
    if (userId == null) throw StateError('Silakan masuk terlebih dahulu.');
    final query = SupabaseService.client.from('wishlist');
    if (favorite) {
      await query.upsert({'user_id': userId, 'product_id': productId},
          onConflict: 'user_id,product_id');
    } else {
      await query.delete().eq('user_id', userId).eq('product_id', productId);
    }
  }
}
