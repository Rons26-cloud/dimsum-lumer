import 'package:flutter/material.dart';

/// Design tokens shared with frontend-web/src/theme and styles/global.css.
abstract final class AppColors {
  static const primary = Color(0xFFE96818);
  static const primaryDark = Color(0xFFD85B0D);
  static const orange50 = Color(0xFFFFF7ED);
  static const orange100 = Color(0xFFFFEDD5);
  static const canvas = Color(0xFFF8FAFC);
  static const surface = Colors.white;
  static const text = Color(0xFF0F172A);
  static const muted = Color(0xFF64748B);
  static const border = Color(0xFFE2E8F0);
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);
}

abstract final class AppRadius {
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
}

abstract final class AppSpacing {
  static const page = 16.0;
  static const section = 24.0;
  static const card = 16.0;
}

class AppTheme {
  static const primary = AppColors.primary;
  static const background = AppColors.canvas;
  static const text = AppColors.text;

  static ThemeData get light {
    const scheme = ColorScheme.light(
      primary: AppColors.primary,
      onPrimary: Colors.white,
      primaryContainer: AppColors.orange100,
      onPrimaryContainer: Color(0xFF7C2D12),
      secondary: Color(0xFFFFC107),
      onSecondary: AppColors.text,
      error: AppColors.danger,
      surface: AppColors.surface,
      onSurface: AppColors.text,
      onSurfaceVariant: AppColors.muted,
      outline: AppColors.border,
      outlineVariant: Color(0xFFF1F5F9),
    );
    const baseText = TextStyle(
      color: AppColors.text,
      fontFamilyFallback: ['Inter', 'Roboto', 'Arial'],
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.canvas,
      canvasColor: AppColors.canvas,
      fontFamilyFallback: const ['Inter', 'Roboto', 'Arial'],
      splashFactory: InkSparkle.splashFactory,
      visualDensity: VisualDensity.standard,
      textTheme: TextTheme(
        headlineSmall: baseText.copyWith(fontSize: 24, height: 1.2, fontWeight: FontWeight.w800, letterSpacing: -.35),
        titleLarge: baseText.copyWith(fontSize: 20, height: 1.25, fontWeight: FontWeight.w800, letterSpacing: -.25),
        titleMedium: baseText.copyWith(fontSize: 16, height: 1.3, fontWeight: FontWeight.w700),
        titleSmall: baseText.copyWith(fontSize: 14, height: 1.35, fontWeight: FontWeight.w700),
        bodyLarge: baseText.copyWith(fontSize: 16, height: 1.5),
        bodyMedium: baseText.copyWith(fontSize: 14, height: 1.5),
        bodySmall: baseText.copyWith(fontSize: 12, height: 1.45, color: AppColors.muted),
        labelLarge: baseText.copyWith(fontSize: 14, fontWeight: FontWeight.w700),
        labelMedium: baseText.copyWith(fontSize: 12, fontWeight: FontWeight.w700),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.text,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleSpacing: 16,
        toolbarHeight: 64,
        shape: Border(bottom: BorderSide(color: Color(0xFFEEF0F3))),
        titleTextStyle: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.w800, fontFamilyFallback: ['Inter', 'Roboto', 'Arial']),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        shadowColor: const Color(0x14000000),
        margin: EdgeInsets.zero,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg), side: const BorderSide(color: Color(0xFFF1F5F9))),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
        labelStyle: const TextStyle(color: AppColors.muted, fontSize: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md), borderSide: const BorderSide(color: AppColors.danger)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      filledButtonTheme: FilledButtonThemeData(style: FilledButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        disabledBackgroundColor: const Color(0xFFFED7AA),
        minimumSize: const Size(0, 48),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      )),
      outlinedButtonTheme: OutlinedButtonThemeData(style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.text,
        minimumSize: const Size(0, 48),
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      )),
      textButtonTheme: TextButtonThemeData(style: TextButton.styleFrom(foregroundColor: AppColors.primary, textStyle: const TextStyle(fontWeight: FontWeight.w700))),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.white,
        selectedColor: AppColors.orange100,
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        labelStyle: const TextStyle(fontSize: 12, color: AppColors.text, fontWeight: FontWeight.w600),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      ),
      dividerTheme: const DividerThemeData(color: Color(0xFFF1F5F9), thickness: 1, space: 1),
      listTileTheme: const ListTileThemeData(iconColor: AppColors.muted, textColor: AppColors.text, contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 2)),
      dialogTheme: DialogThemeData(backgroundColor: Colors.white, surfaceTintColor: Colors.transparent, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.xl))),
      bottomSheetTheme: const BottomSheetThemeData(backgroundColor: Colors.white, surfaceTintColor: Colors.transparent, showDragHandle: true, shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)))),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.text,
        contentTextStyle: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
        behavior: SnackBarBehavior.floating,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(color: AppColors.primary),
      refreshIndicatorTheme: const RefreshIndicatorThemeData(color: AppColors.primary, backgroundColor: Colors.white),
    );
  }
}
