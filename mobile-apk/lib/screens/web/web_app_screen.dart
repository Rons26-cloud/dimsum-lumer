import 'dart:convert';
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../../config/app_config.dart';

class WebAppScreen extends StatefulWidget {
  const WebAppScreen({super.key});

  @override
  State<WebAppScreen> createState() => _WebAppScreenState();
}

class _WebAppScreenState extends State<WebAppScreen> {
  late final WebViewController _controller;
  int _progress = 0;
  bool _mainFrameFailed = false;
  StreamSubscription<AuthState>? _authSubscription;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFF8FAFC))
      ..addJavaScriptChannel(
        'DimsumLumerApp',
        onMessageReceived: _handleAppMessage,
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (mounted) setState(() => _progress = progress);
          },
          onPageStarted: (_) {
            if (mounted) setState(() => _mainFrameFailed = false);
          },
          onWebResourceError: (error) {
            if (error.isForMainFrame == true && mounted) {
              setState(() => _mainFrameFailed = true);
            }
          },
          onNavigationRequest: _handleNavigation,
        ),
      )
      ..loadRequest(Uri.parse(AppConfig.frontendUrl));
    _configureAndroidPermissions();
    _authSubscription = Supabase.instance.client.auth.onAuthStateChange.listen(
      (state) {
        if (state.session != null) _sendSessionToWeb(state.session!);
      },
    );
  }

  Future<void> _handleAppMessage(JavaScriptMessage message) async {
    try {
      final payload = jsonDecode(message.message);
      if (payload is! Map || payload['type'] != 'google_sign_in') return;
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: AppConfig.authCallback,
        authScreenLaunchMode: LaunchMode.externalApplication,
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login Google belum dapat dibuka. Silakan coba lagi.'),
        ),
      );
    }
  }

  Future<void> _sendSessionToWeb(Session session) async {
    final accessToken = jsonEncode(session.accessToken);
    final refreshToken = jsonEncode(session.refreshToken ?? '');
    if (session.refreshToken == null || session.refreshToken!.isEmpty) return;
    await _controller.runJavaScript('''
      window.dispatchEvent(new CustomEvent('dimsum-lumer-auth', {
        detail: { accessToken: $accessToken, refreshToken: $refreshToken }
      }));
    ''');
  }

  Future<void> _configureAndroidPermissions() async {
    final platform = _controller.platform;
    if (platform is! AndroidWebViewController) return;
    await platform.setGeolocationPermissionsPromptCallbacks(
      onShowPrompt: (request) async {
        final origin = Uri.tryParse(request.origin);
        if (origin?.scheme != 'https' ||
            origin?.host.toLowerCase() != AppConfig.frontendHost) {
          return const GeolocationPermissionsResponse(
              allow: false, retain: false);
        }
        var permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }
        final allowed = permission == LocationPermission.whileInUse ||
            permission == LocationPermission.always;
        return GeolocationPermissionsResponse(
            allow: allowed, retain: allowed);
      },
    );
  }

  Future<NavigationDecision> _handleNavigation(
      NavigationRequest request) async {
    if (!request.isMainFrame) return NavigationDecision.navigate;
    final uri = Uri.tryParse(request.url);
    if (uri == null) return NavigationDecision.prevent;

    final isOfficialFrontend = uri.scheme == 'https' &&
        uri.host.toLowerCase() == AppConfig.frontendHost;
    if (isOfficialFrontend) return NavigationDecision.navigate;

    if (const {'https', 'mailto', 'tel', 'sms'}.contains(uri.scheme)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    return NavigationDecision.prevent;
  }

  Future<bool> _handleBack() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
      return false;
    }
    return true;
  }

  Future<void> _retry() async {
    setState(() {
      _mainFrameFailed = false;
      _progress = 0;
    });
    await _controller.loadRequest(Uri.parse(AppConfig.frontendUrl));
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _handleBack,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: SafeArea(
          child: Stack(
            children: [
              Positioned.fill(child: WebViewWidget(controller: _controller)),
              if (_progress < 100 && !_mainFrameFailed)
                Align(
                  alignment: Alignment.topCenter,
                  child: LinearProgressIndicator(
                    value: _progress == 0 ? null : _progress / 100,
                    minHeight: 3,
                    color: const Color(0xFFE96818),
                    backgroundColor: const Color(0xFFFFEDD5),
                  ),
                ),
              if (_mainFrameFailed)
                Positioned.fill(
                  child: ColoredBox(
                    color: const Color(0xFFF8FAFC),
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(28),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.wifi_off_rounded,
                                size: 48, color: Color(0xFFE96818)),
                            const SizedBox(height: 16),
                            const Text(
                              'Tidak dapat membuka Dimsum Lumer',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.w800),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'Periksa koneksi internet, lalu coba kembali.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: Color(0xFF64748B)),
                            ),
                            const SizedBox(height: 20),
                            FilledButton.icon(
                              onPressed: _retry,
                              icon: const Icon(Icons.refresh_rounded),
                              label: const Text('Coba Lagi'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
