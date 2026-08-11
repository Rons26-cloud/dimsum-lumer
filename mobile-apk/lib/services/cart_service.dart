import 'supabase_service.dart';
import 'supabase_realtime_service.dart';
import '../security/input_validator.dart';

class CartService {
  static Stream<List<Map<String, dynamic>>> watchCurrentCart() {
    final user = SupabaseService.client.auth.currentUser;
    if (user == null) return const Stream.empty();
    return SupabaseService.client
        .from('cart_items')
        .stream(primaryKey: ['id'])
        .eq('user_id', user.id)
        .order('created_at');
  }

  static Future<void> addProduct(Map<String, dynamic> product,
      {int quantity = 1, String variant = 'Original'}) async {
    RealtimeAppConfig.instance.ensureStoreOpen();
    if (SupabaseService.client.auth.currentUser == null)
      throw StateError('Silakan masuk terlebih dahulu.');
    await SupabaseService.client.rpc('add_cart_item', params: {
      'p_product_id': InputValidator.uuid(product['id'], field: 'ID produk'),
      'p_quantity': InputValidator.quantity(quantity),
      'p_variant': InputValidator.variant(variant),
      'p_flash_sale_id': null,
      'p_unit_price': null,
    });
  }

  static Future<void> removeItem(String cartItemId) async {
    final user = SupabaseService.client.auth.currentUser;
    if (user == null) throw StateError('Silakan masuk terlebih dahulu.');
    await SupabaseService.client
        .from('cart_items')
        .delete()
        .eq('id', InputValidator.uuid(cartItemId, field: 'ID keranjang'))
        .eq('user_id', user.id);
  }

  static Future<void> updateQuantity(String cartItemId, int quantity) async {
    final user = SupabaseService.client.auth.currentUser;
    if (user == null) throw StateError('Silakan masuk terlebih dahulu.');
    if (quantity < 1) return removeItem(cartItemId);
    final safeQuantity = InputValidator.quantity(quantity);
    await SupabaseService.client
        .from('cart_items')
        .update({'quantity': safeQuantity})
        .eq('id', InputValidator.uuid(cartItemId, field: 'ID keranjang'))
        .eq('user_id', user.id);
  }

  static void ensureCheckoutAllowed() =>
      RealtimeAppConfig.instance.ensureStoreOpen();
}
