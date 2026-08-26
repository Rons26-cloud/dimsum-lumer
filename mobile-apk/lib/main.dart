import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_tts/flutter_tts.dart';
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
    // Konfigurasi jaringan tidak boleh menahan launch screen Android.
    // Intro memakai fallback lokal lalu menerima pembaruan secara real-time.
    unawaited(RealtimeAppConfig.instance.start());
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
      builder: (context, child) => _WelcomeIntroGate(
          child: _RealtimeGate(child: child ?? const SizedBox.shrink())),
    );
  }
}

class _WelcomeIntroGate extends StatefulWidget {
  final Widget child;
  const _WelcomeIntroGate({required this.child});

  @override
  State<_WelcomeIntroGate> createState() => _WelcomeIntroGateState();
}

class _WelcomeIntroGateState extends State<_WelcomeIntroGate>
    with SingleTickerProviderStateMixin {
  late final AnimationController _motion;
  late final FlutterTts _tts;
  Timer? _typingTimer;
  Timer? _speechWatchdog;
  bool _visible = true;
  bool _talking = true;
  String _spokenText = '';
  int _characterIndex = 0;

  Map<String, dynamic> get _config => RealtimeAppConfig.instance.welcomeIntro;
  @override
  void initState() {
    super.initState();
    _motion = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200))..repeat();
    _tts = FlutterTts();
    _startSpeaking();
  }

  Future<void> _startSpeaking() async {
    final configured = '${_config['message'] ?? 'Halo! Selamat datang di Dimsum Lumer!'}'.trim();
    final sentence = configured.replaceFirst(
      RegExp(r'^hello\b[,.!\s-]*', caseSensitive: false),
      'Halo! ',
    );
    _typingTimer?.cancel();
    _speechWatchdog?.cancel();
    await _tts.stop();
    if (!mounted) return;
    setState(() {
      _spokenText = '';
      _characterIndex = 0;
      _talking = true;
    });
    _tts.setStartHandler(() {
      if (mounted) setState(() => _talking = true);
    });
    _tts.setProgressHandler((text, start, end, word) {
      if (!mounted) return;
      _speechWatchdog?.cancel();
      final safeEnd = end.clamp(0, sentence.length).toInt();
      setState(() {
        _characterIndex = safeEnd;
        _spokenText = sentence.substring(0, safeEnd);
        _talking = safeEnd < sentence.length;
      });
    });
    _tts.setCompletionHandler(() {
      if (mounted) setState(() {
        _spokenText = sentence;
        _characterIndex = sentence.length;
        _talking = false;
      });
    });
    _tts.setErrorHandler((_) => _startFallbackTyping(sentence));
    await _tts.setLanguage('id-ID');
    await _selectSweetIndonesianVoice();
    await _tts.setSpeechRate(.38);
    await _tts.setPitch(1.80);
    await _tts.awaitSpeakCompletion(true);
    _speechWatchdog = Timer(const Duration(milliseconds: 750), () {
      if (_spokenText.isEmpty) _startFallbackTyping(sentence);
    });
    try {
      await _tts.speak(sentence);
    } catch (_) {
      _startFallbackTyping(sentence);
    }
  }

  Future<void> _selectSweetIndonesianVoice() async {
    try {
      final rawVoices = await _tts.getVoices;
      if (rawVoices is! List) return;
      const sweetHints = <String>[
        'female', 'woman', 'girl', 'gadis', 'siti', 'damayanti', 'cahya'
      ];
      const maleHints = <String>[
        'male', 'man', 'pria', 'ardi', 'andika', 'dimas'
      ];
      final voices = rawVoices.whereType<Map>().where((voice) {
        final locale = '${voice['locale'] ?? voice['language'] ?? ''}'.toLowerCase();
        return locale == 'id-id' || locale.startsWith('id_') || locale == 'id' ||
            locale == 'ms-my' || locale.startsWith('ms_') || locale == 'ms';
      }).toList();
      if (voices.isEmpty) return;
      final preferred = voices.cast<Map>().where((voice) {
        final name = '${voice['name'] ?? ''}'.toLowerCase();
        return sweetHints.any(name.contains);
      }).firstOrNull;
      final nonMale = voices.cast<Map>().where((voice) {
        final name = '${voice['name'] ?? ''}'.toLowerCase();
        return !maleHints.any(name.contains);
      }).firstOrNull;
      final selected = preferred ?? nonMale;
      if (selected == null) return;
      await _tts.setVoice({
        'name': '${selected['name'] ?? ''}',
        'locale': '${selected['locale'] ?? selected['language'] ?? 'id-ID'}',
      });
    } catch (_) {
      // setLanguage di atas tetap menjadi fallback jika daftar voice tidak ada.
    }
  }

  void _startFallbackTyping(String sentence) {
    _typingTimer?.cancel();
    void next() {
      if (!mounted || !_visible || _characterIndex >= sentence.length) return;
      _characterIndex += 1;
      setState(() {
        _spokenText = sentence.substring(0, _characterIndex);
        _talking = _characterIndex < sentence.length;
      });
      if (_characterIndex < sentence.length) {
        final previous = sentence[_characterIndex - 1];
        _typingTimer = Timer(Duration(milliseconds: previous == ',' ? 320 : previous == ' ' ? 75 : 48), next);
      }
    }
    next();
  }

  void _finish() {
    if (!mounted || !_visible) return;
    setState(() => _visible = false);
    _typingTimer?.cancel();
    _speechWatchdog?.cancel();
    unawaited(_tts.stop());
    _motion.stop();
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _speechWatchdog?.cancel();
    unawaited(_tts.stop());
    _motion.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible) return widget.child;
    return Material(
      color: const Color(0xFFFFF8F0),
      child: SafeArea(
        child: Stack(children: [
          Positioned.fill(child: CustomPaint(painter: _IntroGlowPainter())),
          Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                    constraints: const BoxConstraints(maxWidth: 310, minHeight: 56),
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: .95),
                        borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(22), topRight: Radius.circular(22),
                            bottomRight: Radius.circular(22), bottomLeft: Radius.circular(6)),
                        border: Border.all(color: const Color(0xFFFED7AA)),
                        boxShadow: const [BoxShadow(color: Color(0x1A9A3412), blurRadius: 24, offset: Offset(0, 10))]),
                    child: Text('$_spokenText${_talking ? '|' : ''}', textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 13, height: 1.4, fontWeight: FontWeight.w700, color: Color(0xFF431407))),
                  ),
                const SizedBox(height: 14),
                AnimatedBuilder(
                  animation: _motion,
                  builder: (context, child) {
                    final phase = _motion.value;
                    final float = phase < .5 ? phase * -20 : (1 - phase) * -20;
                    final blinking = (phase > .20 && phase < .235) || (phase > .72 && phase < .755);
                    final talking = _talking && (phase * 14).floor().isEven;
                    return Transform.translate(
                      offset: Offset(0, float),
                      child: Transform.rotate(
                        angle: (phase < .5 ? phase : 1 - phase) * .035 - .009,
                        child: SizedBox(width: 240, height: 240, child: Stack(children: [
                          Positioned.fill(child: Image.asset('assets/logo.png', fit: BoxFit.contain)),
                          Positioned.fill(
                            child: Transform.scale(
                              scaleY: talking ? 1.055 : .975,
                              alignment: const Alignment(0, .38),
                              child: ClipPath(
                                clipper: _MouthClipper(),
                                child: Image.asset('assets/logo.png', fit: BoxFit.contain),
                              ),
                            ),
                          ),
                          if (blinking) ...[
                            Positioned(left: 70, top: 109, child: _Eyelid()),
                            Positioned(right: 70, top: 109, child: _Eyelid()),
                          ],
                          Positioned(left: 43, top: 137, child: _Cheek(opacity: .10 + phase * .12)),
                          Positioned(right: 43, top: 137, child: _Cheek(opacity: .10 + phase * .12)),
                          Positioned(left: 4, top: 54, child: _Sparkle(opacity: phase < .5 ? phase * 2 : (1 - phase) * 2, size: 22)),
                          Positioned(right: 8, top: 39, child: _Sparkle(opacity: phase > .35 ? (1 - phase).abs() : phase, size: 17)),
                        ])),
                      ),
                    );
                  },
                ),
                const Text('Dimsum Lumer', style: TextStyle(fontSize: 27, fontWeight: FontWeight.w900, color: Color(0xFFEA580C))),
                const SizedBox(height: 4),
                const Text('Hangat, lembut, dan dibuat dengan sepenuh hati', textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: Color(0xFF9A3412))),
                const SizedBox(height: 22),
                Row(mainAxisSize: MainAxisSize.min, children: [
                IconButton.filledTonal(
                  onPressed: _startSpeaking,
                  tooltip: 'Putar suara lagi',
                  icon: const Icon(Icons.volume_up_rounded),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _finish,
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFFC2410C),
                    padding: const EdgeInsets.fromLTRB(18, 12, 10, 12),
                    side: const BorderSide(color: Color(0xFFFED7AA)),
                    elevation: 3,
                    shape: const StadiumBorder(),
                  ),
                  label: const Text('Lanjut ke Menu', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                  iconAlignment: IconAlignment.end,
                  icon: Container(
                    width: 29, height: 29,
                    decoration: const BoxDecoration(color: Color(0xFFF97316), shape: BoxShape.circle),
                    child: const Icon(Icons.arrow_forward_rounded, size: 18, color: Colors.white),
                  ),
                ),]),
              ]),
            ),
          ),
        ]),
      ),
    );
  }
}

class _Eyelid extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(width: 32, height: 15,
      decoration: BoxDecoration(color: const Color(0xFFF1B86F), borderRadius: BorderRadius.circular(30)));
}

class _MouthClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) => Path()
    ..addRRect(RRect.fromRectAndRadius(
      Rect.fromLTRB(size.width * .42, size.height * .62, size.width * .58, size.height * .75),
      const Radius.circular(18),
    ));
  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

class _Cheek extends StatelessWidget {
  final double opacity;
  const _Cheek({required this.opacity});
  @override
  Widget build(BuildContext context) => Container(
    width: 34, height: 22,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: const Color(0xFFFB7185).withValues(alpha: opacity.clamp(0, .3).toDouble()),
    ),
  );
}

class _Sparkle extends StatelessWidget {
  final double opacity;
  final double size;
  const _Sparkle({required this.opacity, required this.size});
  @override
  Widget build(BuildContext context) => Opacity(
    opacity: opacity.clamp(0, 1).toDouble(),
    child: Icon(Icons.auto_awesome_rounded, size: size, color: const Color(0xFFF59E0B)),
  );
}

class _IntroGlowPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * .48);
    final paint = Paint()..shader = const RadialGradient(colors: [Color(0x55FBBF24), Color(0x11F97316), Colors.transparent])
        .createShader(Rect.fromCircle(center: center, radius: size.width * .55));
    canvas.drawCircle(center, size.width * .55, paint);
  }
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
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
    await AppUpdateService.showUpdatePrompt(dialogContext);
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
