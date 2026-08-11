import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final SupabaseClient client = Supabase.instance.client;

  static Stream<List<Map<String, dynamic>>> watchMaintenance() {
    return (() async* {
      while (true) {
        try {
          final result = await client.rpc('get_maintenance_status',
              params: {'p_target': 'mobile-apk'});
          yield result is Map<String, dynamic>
              ? <Map<String, dynamic>>[result]
              : <Map<String, dynamic>>[];
        } catch (_) {
          final rows = await client
              .from('maintenance')
              .select()
              .inFilter('target', ['mobile-apk', 'both']);
          yield List<Map<String, dynamic>>.from(rows);
        }
        await Future<void>.delayed(const Duration(seconds: 10));
      }
    })();
  }
}
