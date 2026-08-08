class InputValidator {
  InputValidator._();

  static final RegExp _uuid = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      caseSensitive: false);
  static final RegExp _email = RegExp(r'^[^@\s]{1,64}@[^@\s]{1,190}$');
  static final RegExp _safeName =
      RegExp(r"^[\p{L}\p{M} .'’-]+$", unicode: true);
  static final RegExp _safeVariant =
      RegExp(r"^[\p{L}\p{N} .,'’()+&/-]+$", unicode: true);

  static String uuid(Object? value, {String field = 'ID'}) {
    final normalized = '$value'.trim();
    if (!_uuid.hasMatch(normalized))
      throw FormatException('$field tidak valid.');
    return normalized;
  }

  static String email(String value) {
    final normalized = value.trim().toLowerCase();
    if (normalized.length > 254 || !_email.hasMatch(normalized))
      throw const FormatException('Format email tidak valid.');
    return normalized;
  }

  static String password(String value) {
    if (value.length < 8 || value.length > 128)
      throw const FormatException('Kata sandi harus berisi 8–128 karakter.');
    return value;
  }

  static String fullName(String value) {
    final normalized = value.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (normalized.length < 2 ||
        normalized.length > 80 ||
        !_safeName.hasMatch(normalized))
      throw const FormatException('Nama tidak valid.');
    return normalized;
  }

  static String phone(String value) {
    final normalized = value.replaceAll(RegExp(r'[^0-9+]'), '');
    if (!RegExp(r'^\+?[0-9]{8,15}$').hasMatch(normalized))
      throw const FormatException('Nomor HP tidak valid.');
    return normalized;
  }

  static int quantity(int value) {
    if (value < 1 || value > 99)
      throw const FormatException('Jumlah produk harus antara 1 dan 99.');
    return value;
  }

  static String variant(String value) {
    final normalized = value.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (normalized.isEmpty ||
        normalized.length > 40 ||
        !_safeVariant.hasMatch(normalized))
      throw const FormatException('Varian produk tidak valid.');
    return normalized;
  }
}
