import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'supabase_realtime_service.dart';

class AppConfigService {
  static Set<String> get _downloadHosts {
    final configured = dotenv.env['APK_DOWNLOAD_HOSTS'] ?? '';
    final supabaseHost = Uri.tryParse(dotenv.env['SUPABASE_URL'] ?? '')?.host;
    return {
      ...configured.split(',').map((value) => value.trim().toLowerCase()),
      if (supabaseHost != null) supabaseHost.toLowerCase(),
    }..removeWhere((value) => value.isEmpty);
  }

  static int _compare(String a, String b) {
    final left = a.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final right = b.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    for (var i = 0; i < 3; i++) {
      final diff =
          (i < left.length ? left[i] : 0) - (i < right.length ? right[i] : 0);
      if (diff != 0) return diff;
    }
    return 0;
  }

  static Future<bool> requiresUpdate() async {
    final package = await PackageInfo.fromPlatform();
    final config = RealtimeAppConfig.instance.apkVersion;
    return config['force_update'] == true &&
        _compare('${config['version'] ?? package.version}', package.version) >
            0;
  }

  static Future<void> openDownload() async {
    final url = Uri.tryParse(
        '${RealtimeAppConfig.instance.apkVersion['download_url'] ?? ''}');
    if (url == null ||
        url.scheme != 'https' ||
        url.host.isEmpty ||
        url.userInfo.isNotEmpty ||
        !_downloadHosts.contains(url.host.toLowerCase()) ||
        !url.path.toLowerCase().endsWith('.apk') ||
        !await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw Exception('Link unduhan APK tidak valid atau tidak aman.');
    }
  }

  static Future<void> showForceUpdate(BuildContext context) async {
    if (!await requiresUpdate() || !context.mounted) return;
    await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (_) => PopScope(
            canPop: false,
            child: AlertDialog(
                icon: const Icon(Icons.system_update_rounded,
                    size: 42, color: Color(0xFFFF7A00)),
                title: Text(
                    'Update wajib v${RealtimeAppConfig.instance.apkVersion['version']}'),
                content: const Text(
                    'Versi baru diperlukan agar aplikasi tetap aman dan dapat digunakan.'),
                actions: [
                  FilledButton.icon(
                      onPressed: openDownload,
                      icon: const Icon(Icons.download_rounded),
                      label: const Text('Download APK'))
                ])));
  }
}
