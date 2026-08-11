import 'package:flutter/material.dart';
import '../config/app_config.dart';

class AppTheme {
  static const primary = Color(AppConfig.primaryColorHex);
  static const background = Color(0xFFF8FAFC);
  static const text = Color(0xFF0F172A);

  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.light,
      surface: Colors.white,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      fontFamilyFallback: const ['Inter', 'Roboto', 'Arial'],
      textTheme: const TextTheme(
        headlineSmall: TextStyle(
            fontSize: 24,
            height: 1.2,
            fontWeight: FontWeight.w700,
            color: text),
        titleLarge: TextStyle(
            fontSize: 20,
            height: 1.25,
            fontWeight: FontWeight.w700,
            color: text),
        titleMedium: TextStyle(
            fontSize: 16,
            height: 1.3,
            fontWeight: FontWeight.w600,
            color: text),
        bodyLarge: TextStyle(fontSize: 16, height: 1.5, color: text),
        bodyMedium: TextStyle(fontSize: 14, height: 1.5, color: text),
        bodySmall:
            TextStyle(fontSize: 12, height: 1.45, color: Color(0xFF64748B)),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
      ),
      cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 0,
          surfaceTintColor: Colors.transparent,
          margin: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: Color(0xFFE2E8F0)))),
      inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none),
          enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
          focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: primary, width: 1.5)),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 15)),
      filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
              minimumSize: const Size(0, 48),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              textStyle: const TextStyle(fontWeight: FontWeight.w700))),
      outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 48),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)))),
      snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFFFFEDD5),
        elevation: 0,
        height: 68,
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
              color: states.contains(WidgetState.selected)
                  ? const Color(AppConfig.primaryColorHex)
                  : Colors.grey.shade500,
              size: 22,
            )),
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
              color: states.contains(WidgetState.selected)
                  ? const Color(AppConfig.primaryColorHex)
                  : Colors.grey.shade500,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            )),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor: Color(AppConfig.primaryColorHex),
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
