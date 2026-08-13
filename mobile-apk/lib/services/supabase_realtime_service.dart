import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';
import '../security/input_validator.dart';

class RealtimeAppConfig extends ChangeNotifier {
  RealtimeAppConfig._();
  static final instance = RealtimeAppConfig._();
  RealtimeChannel? _channel;
  Map<String, dynamic> storeInfo = const {
    'is_open': true,
    'open_time': '08:00',
    'close_time': '21:00'
  };
  Map<String, dynamic> apkVersion = const {};
  Map<String, dynamic> welcomeIntro = const {
    'enabled': true,
    'require_action': true,
    'message': 'Halo! Selamat datang di Dimsum Lumer!'
  };
  List<Map<String, dynamic>> homeBanners = const [];
  bool loading = true;
  String? error;
  bool get isStoreOpen => storeInfo['is_open'] != false;

  Map<String, dynamic> _value(Map<String, dynamic>? row) =>
      Map<String, dynamic>.from(
          row?['value'] ?? row?['config_value'] ?? const {});

  Future<void> start() async {
    await refresh();
    await _channel?.unsubscribe();
    _channel = SupabaseService.client
        .channel('mobile-app-config-${DateTime.now().millisecondsSinceEpoch}')
      ..onPostgresChanges(
          event: PostgresChangeEvent.all,
          schema: 'public',
          table: 'app_config',
          callback: (_) => unawaited(refresh()))
      ..subscribe();
  }

  Future<void> refresh() async {
    try {
      final rows = await SupabaseService.client
          .from('app_config')
          .select()
          .inFilter('key', ['store_info', 'apk_version', 'home_banners', 'welcome_intro']);
      for (final raw in rows) {
        final row = Map<String, dynamic>.from(raw);
        if (row['key'] == 'store_info') {
          storeInfo = {...storeInfo, ..._value(row)};
        }
        if (row['key'] == 'apk_version') apkVersion = _value(row);
        if (row['key'] == 'welcome_intro') {
          welcomeIntro = {...welcomeIntro, ..._value(row)};
        }
        if (row['key'] == 'home_banners') {
          final value = _value(row);
          final items = value['items'];
          homeBanners = items is List
              ? items
                  .whereType<Map>()
                  .map((item) => Map<String, dynamic>.from(item))
                  .where((item) =>
                      item['is_active'] != false &&
                      Uri.tryParse('${item['image_url'] ?? ''}')?.scheme ==
                          'https')
                  .toList()
              : const [];
        }
      }
      error = null;
    } catch (_) {
      error = 'Konfigurasi belum dapat dimuat.';
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void ensureStoreOpen() {
    if (!isStoreOpen) {
      throw StateError('Toko sedang tutup dan belum menerima pesanan baru.');
    }
  }

  Stream<List<Map<String, dynamic>>> watchOrder(String orderId) =>
      SupabaseService.client.from('orders').stream(primaryKey: ['id']).eq(
          'id', InputValidator.uuid(orderId, field: 'ID pesanan'));

  @override
  void dispose() {
    if (_channel != null) SupabaseService.client.removeChannel(_channel!);
    super.dispose();
  }
}
