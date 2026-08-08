import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

class SafeError {
  SafeError._();

  static String message(Object error,
      {String fallback =
          'Permintaan belum dapat diproses. Silakan coba kembali.'}) {
    final value = error is AuthException
        ? error.message.toLowerCase()
        : error.toString().toLowerCase();
    if (error is SocketException ||
        value.contains('network') ||
        value.contains('socket') ||
        value.contains('connection')) {
      return 'Koneksi internet bermasalah. Coba kembali.';
    }
    if (value.contains('invalid login')) return 'Email atau kata sandi salah.';
    if (value.contains('authentication') ||
        value.contains('jwt') ||
        value.contains('session'))
      return 'Sesi berakhir. Silakan masuk kembali.';
    if (value.contains('stock')) return 'Stok produk tidak mencukupi.';
    if (value.contains('cart'))
      return 'Keranjang tidak valid atau sudah diproses.';
    if (value.contains('address')) return 'Alamat pengiriman tidak valid.';
    if (value.contains('coordinates') || value.contains('lokasi'))
      return 'Lokasi pengiriman tidak valid.';
    if (error is FormatException) return error.message;
    return fallback;
  }
}
