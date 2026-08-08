import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';
import '../security/input_validator.dart';

class AuthService {
  static String normalizeEmail(String value) => InputValidator.email(value);

  static Future<AuthResponse> signIn(String email, String password) =>
      SupabaseService.client.auth.signInWithPassword(
          email: normalizeEmail(email),
          password: InputValidator.password(password));

  static Future<AuthResponse> signUp(
      String email, String password, String fullName, String phone) async {
    final response = await SupabaseService.client.auth.signUp(
      email: normalizeEmail(email),
      password: InputValidator.password(password),
      data: {
        'full_name': InputValidator.fullName(fullName),
        'phone': InputValidator.phone(phone)
      },
    );
    if (response.user?.identities?.isEmpty == true)
      throw const AuthException('Email sudah terdaftar. Silakan masuk.');
    if (response.session != null) return response;
    try {
      return await signIn(email, password);
    } on AuthException catch (error) {
      if (error.message.toLowerCase().contains('confirm')) {
        throw const AuthException(
            'Pendaftaran berhasil. Konfirmasi email diperlukan sebelum masuk.');
      }
      rethrow;
    }
  }

  static Future<void> signOut() => SupabaseService.client.auth.signOut();
  static bool get isLoggedIn => SupabaseService.client.auth.currentUser != null;
}
