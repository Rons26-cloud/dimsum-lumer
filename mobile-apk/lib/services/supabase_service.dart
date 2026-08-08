import 'package:supabase_flutter/supabase_flutter.dart';

// Client tunggal Supabase yang dipakai di seluruh screen/service Flutter,
// setara dengan supabase/client.js di frontend-web & admin-dashboard.
class SupabaseService {
  static final SupabaseClient client = Supabase.instance.client;

  static Stream<List<Map<String, dynamic>>> watchMaintenance() {
    return client.from('maintenance').stream(primaryKey: ['id']);
  }
}
