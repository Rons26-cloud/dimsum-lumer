import 'supabase_service.dart';

class CatalogService {
  static Stream<List<Map<String, dynamic>>> watchCategories() =>
      SupabaseService.client
          .from('categories')
          .stream(primaryKey: ['id']).order('name');

  static Stream<List<Map<String, dynamic>>> watchPromos() =>
      SupabaseService.client
          .from('promos')
          .stream(primaryKey: ['id'])
          .eq('is_active', true)
          .order('created_at', ascending: false);
}
