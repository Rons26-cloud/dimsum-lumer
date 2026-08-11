import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';

class ScheduledMaintenanceNotice extends StatefulWidget {
  final DateTime startTime;
  final String? message;
  const ScheduledMaintenanceNotice(
      {super.key, required this.startTime, this.message});

  @override
  State<ScheduledMaintenanceNotice> createState() =>
      _ScheduledMaintenanceNoticeState();
}

class _ScheduledMaintenanceNoticeState
    extends State<ScheduledMaintenanceNotice> {
  Timer? _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final duration = widget.startTime.difference(_now);
    final total = duration.isNegative ? 0 : duration.inSeconds;
    final days = total ~/ 86400;
    final hours = (total ~/ 3600) % 24;
    final minutes = (total ~/ 60) % 60;
    final seconds = total % 60;
    final countdown =
        '${days > 0 ? '$days hari ' : ''}${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
    return Material(
        color: const Color(0xFFFFF3E0),
        child: SafeArea(
            bottom: false,
            child: Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                child: Row(children: [
                  const Icon(Icons.build_circle_outlined,
                      color: Color(0xFFE86600), size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                        const Text('Maintenance akan segera dimulai',
                            style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF7C3A00))),
                        Text(
                            widget.message?.trim().isNotEmpty == true
                                ? widget.message!.trim()
                                : 'Simpan pekerjaan Anda sebelum pemeliharaan dimulai.',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                fontSize: 9, color: Color(0xFF9A5B24)))
                      ])),
                  const SizedBox(width: 8),
                  Text(countdown,
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFE86600)))
                ]))));
  }
}

class MaintenanceScreen extends StatefulWidget {
  final String? message;
  final DateTime? startTime;
  final DateTime? endTime;
  const MaintenanceScreen(
      {super.key, this.message, this.startTime, this.endTime});

  @override
  State<MaintenanceScreen> createState() => _MaintenanceScreenState();
}

class _MaintenanceScreenState extends State<MaintenanceScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Timer? _clockTimer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    _clockTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final message = widget.message?.trim();
    return Scaffold(
      backgroundColor: const Color(0xFFFFFBF7),
      body: SafeArea(
        child: Stack(children: [
          Positioned(
              top: -90, left: -90, child: _glow(260, const Color(0xFFFFD5B0))),
          Positioned(
              bottom: -120,
              right: -100,
              child: _glow(300, const Color(0xFFFFE6A8))),
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 520),
                padding: const EdgeInsets.fromLTRB(22, 34, 22, 26),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: .94),
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: const Color(0xFFFFE3CC)),
                  boxShadow: const [
                    BoxShadow(
                        color: Color(0x1FFF7A00),
                        blurRadius: 36,
                        offset: Offset(0, 16))
                  ],
                ),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  AnimatedBuilder(
                    animation: _controller,
                    builder: (context, child) => Transform.translate(
                      offset: Offset(
                          0, math.sin(_controller.value * math.pi * 2) * 7),
                      child: child,
                    ),
                    child: Stack(clipBehavior: Clip.none, children: [
                      Container(
                        width: 124,
                        height: 124,
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                  color: Color(0x33FF7A00), blurRadius: 22)
                            ]),
                        child: Image.asset(
                            'assets/maintenance-logo-transparent.png',
                            fit: BoxFit.contain),
                      ),
                      Positioned(
                          right: -5,
                          bottom: -4,
                          child: Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                  color: const Color(0xFFFF7A00),
                                  shape: BoxShape.circle,
                                  border:
                                      Border.all(color: Colors.white, width: 4),
                                  boxShadow: const [
                                    BoxShadow(
                                        color: Color(0x33000000), blurRadius: 8)
                                  ]),
                              child: const Icon(Icons.build_rounded,
                                  color: Colors.white, size: 17))),
                    ]),
                  ),
                  const SizedBox(height: 28),
                  Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 13, vertical: 8),
                      decoration: BoxDecoration(
                          color: const Color(0xFFFFF3E8),
                          borderRadius: BorderRadius.circular(30),
                          border: Border.all(color: const Color(0xFFFFD7B8))),
                      child:
                          const Row(mainAxisSize: MainAxisSize.min, children: [
                        SizedBox(
                            width: 8,
                            height: 8,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Color(0xFFFF7A00))),
                        SizedBox(width: 8),
                        Text('PEMBARUAN SISTEM BERLANGSUNG',
                            style: TextStyle(
                                fontSize: 9,
                                letterSpacing: .7,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFFC45C00)))
                      ])),
                  const SizedBox(height: 20),
                  const Text('Sedang Dalam Perbaikan',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontSize: 25,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF111827),
                          letterSpacing: -.5)),
                  const SizedBox(height: 12),
                  Text(
                      message?.isNotEmpty == true
                          ? message!
                          : 'Mohon maaf, Dimsum Lumer sedang dalam pemeliharaan untuk meningkatkan kualitas layanan. Silakan kembali beberapa saat lagi.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 13,
                          height: 1.65,
                          color: Color(0xFF6B7280))),
                  const SizedBox(height: 22),
                  Container(
                      padding: const EdgeInsets.all(15),
                      decoration: BoxDecoration(
                          color: const Color(0xFFFFF8F1),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: const Color(0xFFFFE3CC))),
                      child: Column(children: [
                        const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.schedule_rounded,
                                  size: 16, color: Color(0xFFC45C00)),
                              SizedBox(width: 7),
                              Text('Sistem akan segera kembali normal',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFFC45C00)))
                            ]),
                        const SizedBox(height: 13),
                        Row(children: [
                          Expanded(
                              child: _scheduleCard('MULAI', widget.startTime)),
                          const SizedBox(width: 8),
                          Expanded(
                              child: _scheduleCard('SELESAI', widget.endTime)),
                        ]),
                        const SizedBox(height: 13),
                        Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.timer_outlined,
                                  size: 15, color: Color(0xFFC45C00)),
                              const SizedBox(width: 6),
                              Flexible(
                                  child: Text('Sisa waktu: ${_remaining()}',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFFC45C00)))),
                            ]),
                        const SizedBox(height: 12),
                        AnimatedBuilder(
                            animation: _controller,
                            builder: (context, _) => LinearProgressIndicator(
                                value: .18 + (_controller.value * .7),
                                minHeight: 7,
                                borderRadius: BorderRadius.circular(20),
                                backgroundColor: const Color(0xFFFFE7D3),
                                valueColor: const AlwaysStoppedAnimation(
                                    Color(0xFFFF7A00))))
                      ])),
                  const SizedBox(height: 22),
                  const Divider(color: Color(0xFFF3F4F6)),
                  const SizedBox(height: 12),
                  const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.verified_user_outlined,
                            size: 15, color: Color(0xFF10B981)),
                        SizedBox(width: 7),
                        Flexible(
                            child: Text(
                                'Data dan akun Anda tetap aman selama pemeliharaan',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    fontSize: 10, color: Color(0xFF9CA3AF))))
                      ]),
                ]),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _glow(double size, Color color) => Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
          shape: BoxShape.circle, color: color.withValues(alpha: .35)));

  Widget _scheduleCard(String label, DateTime? value) => Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(12)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label,
            style: const TextStyle(
                fontSize: 8,
                fontWeight: FontWeight.w800,
                color: Color(0xFF9CA3AF))),
        const SizedBox(height: 4),
        Text(value == null ? 'Belum ditentukan' : _formatDate(value),
            maxLines: 2,
            style: const TextStyle(
                fontSize: 9,
                height: 1.4,
                fontWeight: FontWeight.w800,
                color: Color(0xFF374151))),
      ]));

  String _formatDate(DateTime value) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des'
    ];
    final local = value.toLocal();
    return '${local.day.toString().padLeft(2, '0')} ${months[local.month - 1]} ${local.year}, ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }

  String _remaining() {
    if (widget.endTime == null) return 'Menunggu admin';
    final duration = widget.endTime!.difference(_now);
    if (duration.isNegative) return '00:00:00';
    final days = duration.inDays;
    final hours = duration.inHours.remainder(24).toString().padLeft(2, '0');
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '${days > 0 ? '$days hari ' : ''}$hours:$minutes:$seconds';
  }
}
