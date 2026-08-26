import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import 'supabase_service.dart';

enum AppUpdateDecision { none, optional, required }

class AppUpdateInfo {
  final bool updateEnabled;
  final String latestVersion;
  final int latestBuild;
  final int minimumBuild;
  final bool forceUpdate;
  final String downloadUrl;
  final String releaseTitle;
  final List<String> releaseNotes;

  const AppUpdateInfo({
    required this.updateEnabled,
    required this.latestVersion,
    required this.latestBuild,
    required this.minimumBuild,
    required this.forceUpdate,
    required this.downloadUrl,
    required this.releaseTitle,
    required this.releaseNotes,
  });

  factory AppUpdateInfo.fromJson(Map<String, dynamic> json) {
    int number(Object? value) => value is int ? value : int.tryParse('$value') ?? 0;
    return AppUpdateInfo(
      updateEnabled: json['updateEnabled'] == true,
      latestVersion: '${json['latestVersion'] ?? ''}'.trim(),
      latestBuild: number(json['latestBuild']),
      minimumBuild: number(json['minimumBuild']),
      forceUpdate: json['forceUpdate'] == true,
      downloadUrl: '${json['downloadUrl'] ?? ''}'.trim(),
      releaseTitle: '${json['releaseTitle'] ?? 'Update Dimsum Lumer'}'.trim(),
      releaseNotes: (json['releaseNotes'] is List)
          ? (json['releaseNotes'] as List)
              .map((item) => '$item'.trim())
              .where((item) => item.isNotEmpty)
              .toList(growable: false)
          : const [],
    );
  }

  AppUpdateDecision decisionFor(int installedBuild) {
    if (!updateEnabled || latestBuild <= installedBuild) {
      return AppUpdateDecision.none;
    }
    if (forceUpdate || installedBuild < minimumBuild) {
      return AppUpdateDecision.required;
    }
    return AppUpdateDecision.optional;
  }
}
class AppUpdateService {
  static Set<String> get _downloadHosts {
    final configured = dotenv.env['APK_DOWNLOAD_HOSTS'] ?? '';
    final supabaseHost = Uri.tryParse(dotenv.env['SUPABASE_URL'] ?? '')?.host;
    return {
      ...configured.split(',').map((value) => value.trim().toLowerCase()),
      if (supabaseHost != null) supabaseHost.toLowerCase(),
    }..removeWhere((value) => value.isEmpty);
  }

  static bool isAllowedDownloadUrl(String value) {
    final url = Uri.tryParse(value);
    if (url == null ||
        url.scheme != 'https' ||
        url.host.isEmpty ||
        url.userInfo.isNotEmpty) {
      return false;
    }
    final host = url.host.toLowerCase();
    if (host == 'play.google.com') {
      return url.path == '/store/apps/details' &&
          url.queryParameters['id'] == 'com.dimsumlumer.dimsum_lumer';
    }
    return _downloadHosts.contains(host) &&
        url.path.toLowerCase().endsWith('.apk');
  }

  static Future<Map<String, dynamic>?> _fetchUpdate() async {
    final raw = await SupabaseService.client.rpc('get_android_app_update');
    return raw is Map ? Map<String, dynamic>.from(raw) : null;
  }

  static Future<({AppUpdateDecision decision, AppUpdateInfo? update})> resolve({
    required int installedBuild,
    Future<Map<String, dynamic>?> Function()? loader,
    Duration timeout = const Duration(seconds: 5),
  }) async {
    try {
      final json = await (loader ?? _fetchUpdate)().timeout(timeout);
      if (json == null) {
        return (decision: AppUpdateDecision.none, update: null);
      }
      final update = AppUpdateInfo.fromJson(json);
      return (decision: update.decisionFor(installedBuild), update: update);
    } catch (_) {
      return (decision: AppUpdateDecision.none, update: null);
    }
  }

  static Future<void> _openDownload(
      BuildContext context, AppUpdateInfo update) async {
    if (!isAllowedDownloadUrl(update.downloadUrl)) {
      _showError(context, 'Link update tidak valid atau tidak aman.');
      return;
    }
    final opened = await launchUrl(Uri.parse(update.downloadUrl),
        mode: LaunchMode.externalApplication);
    if (!opened && context.mounted) {
      _showError(context, 'Link update belum dapat dibuka.');
    }
  }

  static void _showError(BuildContext context, String message) {
    if (!context.mounted) return;
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  static Future<void> showUpdatePrompt(BuildContext context) async {
    final package = await PackageInfo.fromPlatform();
    final installedBuild = int.tryParse(package.buildNumber) ?? 0;
    final result = await resolve(installedBuild: installedBuild);
    if (!context.mounted ||
        result.decision == AppUpdateDecision.none ||
        result.update == null) {
      return;
    }
    final update = result.update!;
    if (result.decision == AppUpdateDecision.required) {
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (dialogContext) => PopScope(
          canPop: false,
          child: AlertDialog(
            icon: const Icon(Icons.system_update_rounded,
                size: 42, color: Color(0xFFFF7A00)),
            title: const Text('Update Diperlukan'),
            content: const Text(
              'Versi aplikasi Dimsum Lumer yang Anda gunakan sudah tidak didukung.\n\nSilakan update aplikasi untuk melanjutkan.',
            ),
            actions: [
              FilledButton.icon(
                onPressed: () => _openDownload(dialogContext, update),
                icon: const Icon(Icons.download_rounded),
                label: const Text('Update Sekarang'),
              ),
            ],
          ),
        ),
      );
      return;
    }

    await showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        icon: const Icon(Icons.system_update_rounded,
            size: 42, color: Color(0xFFFF7A00)),
        title: Text(update.releaseTitle.isEmpty
            ? 'Update Tersedia'
            : update.releaseTitle),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Versi baru Dimsum Lumer tersedia.'),
            const SizedBox(height: 12),
            Text('Versi Saat Ini: ${package.version}'),
            Text('Versi Terbaru: ${update.latestVersion}'),
            if (update.releaseNotes.isNotEmpty) ...[
              const SizedBox(height: 12),
              ...update.releaseNotes.map((note) => Text('• $note')),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Nanti'),
          ),
          FilledButton(
            onPressed: () => _openDownload(dialogContext, update),
            child: const Text('Update Sekarang'),
          ),
        ],
      ),
    );
  }
}
