import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/app_config.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';
import 'services/supabase_realtime_service.dart';
import 'services/app_config_service.dart';
import 'services/supabase_service.dart';
import 'screens/maintenance/maintenance_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: ".env");
    final url = dotenv.env['SUPABASE_URL']?.trim() ?? '';
    final anonKey = dotenv.env['SUPABASE_ANON_KEY']?.trim() ?? '';
    if (!url.startsWith('https://') || anonKey.isEmpty) {
      throw const FormatException('Konfigurasi Supabase belum lengkap.');
    }
    await Supabase.initialize(url: url, publishableKey: anonKey);
    await RealtimeAppConfig.instance.start();
    ErrorWidget.builder = (details) => const _SafeErrorScreen();
    runApp(const DimsumLumerApp());
  } catch (error) {
    if (kDebugMode) debugPrint('Bootstrap gagal: ${error.runtimeType}');
    runApp(const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: _SafeErrorScreen(configurationError: true),
    ));
  }
}

class _SafeErrorScreen extends StatelessWidget {
  final bool configurationError;
  const _SafeErrorScreen({this.configurationError = false});

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: const Color(0xFFFFF8F2),
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline_rounded,
                      size: 38, color: Color(0xFFFF7A00)),
                  const SizedBox(height: 12),
                  const Text('Aplikasi belum dapat dibuka',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(
                    configurationError
                        ? 'Periksa konfigurasi koneksi aplikasi, lalu buka kembali.'
                        : 'Terjadi kendala pada tampilan. Silakan buka kembali aplikasi.',
                    textAlign: TextAlign.center,
                    style:
                        const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
}

class DimsumLumerApp extends StatelessWidget {
  const DimsumLumerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: AppRouter.router,
      builder: (context, child) =>
          _RealtimeGate(child: child ?? const SizedBox.shrink()),
    );
  }
}

class _RealtimeGate extends StatefulWidget {
  final Widget child;
  const _RealtimeGate({required this.child});
  @override
  State<_RealtimeGate> createState() => _RealtimeGateState();
}

class _RealtimeGateState extends State<_RealtimeGate> {
  bool _checking = false;
  Timer? _maintenanceClock;
  @override
  void initState() {
    super.initState();
    RealtimeAppConfig.instance.addListener(_onConfig);
    _maintenanceClock = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() {});
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _onConfig());
  }

  Future<void> _onConfig() async {
    if (_checking || !mounted) return;
    final dialogContext = AppRouter.rootNavigatorKey.currentContext;
    if (dialogContext == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _onConfig());
      return;
    }
    _checking = true;
    await AppConfigService.showForceUpdate(dialogContext);
    _checking = false;
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _maintenanceClock?.cancel();
    RealtimeAppConfig.instance.removeListener(_onConfig);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final config = RealtimeAppConfig.instance;
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: SupabaseService.watchMaintenance(),
      builder: (context, snapshot) {
        Map<String, dynamic>? maintenance;
        Map<String, dynamic>? sharedMaintenance;
        final now = DateTime.now();
        for (final row in snapshot.data ?? const <Map<String, dynamic>>[]) {
          if (row['target'] == 'mobile-apk') maintenance = row;
          if (row['target'] == 'both') sharedMaintenance = row;
        }
        bool isEffective(Map<String, dynamic>? row) {
          if (row?['is_active'] != true) return false;
          final rowStart =
              DateTime.tryParse('${row?['start_time'] ?? ''}')?.toLocal();
          final rowEnd =
              DateTime.tryParse('${row?['end_time'] ?? ''}')?.toLocal();
          return (rowStart == null || !now.isBefore(rowStart)) &&
              (rowEnd == null || !now.isAfter(rowEnd));
        }

        if (!isEffective(maintenance) && isEffective(sharedMaintenance)) {
          maintenance = sharedMaintenance;
        } else {
          maintenance ??= sharedMaintenance;
        }
        final start =
            DateTime.tryParse('${maintenance?['start_time'] ?? ''}')?.toLocal();
        final end =
            DateTime.tryParse('${maintenance?['end_time'] ?? ''}')?.toLocal();
        final scheduledNow = (start == null || !now.isBefore(start)) &&
            (end == null || !now.isAfter(end));
        if (maintenance?['is_active'] == true && scheduledNow) {
          return MaintenanceScreen(
              message: maintenance?['message'] as String?,
              startTime: start,
              endTime: end);
        }
        return Column(children: [
          if (maintenance?['is_active'] == true &&
              start != null &&
              now.isBefore(start))
            ScheduledMaintenanceNotice(
                startTime: start, message: maintenance?['message'] as String?),
          if (!config.isStoreOpen)
            Material(
                color: const Color(0xFFFFF3CD),
                child: SafeArea(
                    bottom: false,
                    child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(8),
                        child: const Text(
                            'Toko sedang tutup. Pemesanan sementara dinonaktifkan.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF7A5200)))))),
          Expanded(child: widget.child)
        ]);
      },
    );
  }
}
