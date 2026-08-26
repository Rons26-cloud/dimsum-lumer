import 'supabase_service.dart';

class MerchantPaymentService {
  static Future<List<Map<String, dynamic>>> loadAccounts() async {
    try {
      final result = await SupabaseService.client.rpc('get_merchant_payment_accounts');
      if (result is! List) return const [];
      return result.map((row) => Map<String, dynamic>.from(row as Map)).toList();
    } catch (_) {
      return const [];
    }
  }

  static Map<String, dynamic>? forMethod(List<Map<String, dynamic>> rows, String method) {
    for (final row in rows) {
      if (row['method_code'] == method && row['is_primary'] == true) return row;
    }
    for (final row in rows) {
      if (row['method_code'] == method || (method == 'transfer' && row['account_type'] == 'bank')) return row;
    }
    return null;
  }
}
