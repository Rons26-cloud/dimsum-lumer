import 'supabase_service.dart';

class NotificationService {
  static String? get userId => SupabaseService.client.auth.currentUser?.id;

  static Stream<List<Map<String, dynamic>>> watchNotifications() {
    final id = userId;
    if (id == null) return const Stream.empty();
    return SupabaseService.client
        .from('notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', id)
        .order('created_at', ascending: false);
  }

  static Future<void> markAsRead(String id) async {
    final currentUserId = userId;
    if (currentUserId == null) return;
    await SupabaseService.client
        .from('notifications')
        .update({'is_read': true})
        .eq('id', id)
        .eq('user_id', currentUserId);
  }

  static Future<void> markAllAsRead() async {
    final currentUserId = userId;
    if (currentUserId == null) return;
    await SupabaseService.client
        .from('notifications')
        .update({'is_read': true})
        .eq('user_id', currentUserId)
        .eq('is_read', false);
  }
}
