import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../services/auth_service.dart';
import '../../services/supabase_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final user = SupabaseService.client.auth.currentUser;
    return Scaffold(
      appBar: AppBar(title: const Text('Akun Saya')),
      body: ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 110), children: [
        if (user == null) ...[
          const _GuestCard(),
          const SizedBox(height: 16),
        ] else ...[
          Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                  color: const Color(0xFFFF7A00),
                  borderRadius: BorderRadius.circular(24)),
              child: Row(children: [
                const CircleAvatar(
                    radius: 29,
                    backgroundColor: Colors.white24,
                    child: Icon(Icons.person, color: Colors.white, size: 30)),
                const SizedBox(width: 14),
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Text(
                          user.userMetadata?['full_name'] ?? 'Pelanggan Dimsum',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold)),
                      Text(user.email ?? 'Silakan masuk',
                          style: const TextStyle(
                              color: Colors.white70, fontSize: 12))
                    ]))
              ])),
          const SizedBox(height: 16),
        ],
        Card(
            child: Column(children: [
          _tile(Icons.storefront_outlined, 'Lokasi Toko',
              onTap: () => context.push('/store-location')),
          _tile(Icons.favorite_border, 'Favorit'),
          _tile(Icons.workspace_premium_outlined, 'Poin & Reward'),
          _tile(Icons.help_outline, 'Bantuan'),
        ])),
        const SizedBox(height: 16),
        if (user != null)
          OutlinedButton(
              onPressed: () async {
                await AuthService.signOut();
              },
              child: const Text('Keluar')),
      ]),
    );
  }

  Widget _tile(IconData icon, String label, {VoidCallback? onTap}) => ListTile(
      onTap: onTap,
      leading: Icon(icon),
      title: Text(label,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right_rounded));
}

class _GuestCard extends StatelessWidget {
  const _GuestCard();

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFFF5F5F4), Colors.white, Color(0xFFFFF7ED)]),
          borderRadius: BorderRadius.circular(32),
        ),
        child: Column(children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(16, 28, 16, 24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF7C2D12),
                    Color(0xFFC2410C),
                    Color(0xFFD97706)
                  ]),
              borderRadius: BorderRadius.circular(28),
              boxShadow: const [
                BoxShadow(
                    color: Color(0x337C2D12),
                    blurRadius: 20,
                    offset: Offset(0, 10))
              ],
            ),
            child: Column(children: [
              Image.asset('assets/logo.png',
                  width: 128, height: 128, fit: BoxFit.contain),
              const SizedBox(height: 16),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                    color: Colors.white12,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white24)),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.verified_user_outlined,
                      size: 13, color: Colors.white),
                  SizedBox(width: 6),
                  Text('AKUN AMAN & TERPERCAYA',
                      style: TextStyle(
                          fontSize: 9,
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          letterSpacing: .6))
                ]),
              ),
              const SizedBox(height: 12),
              const Text('Selamat datang!',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 21,
                      fontWeight: FontWeight.w900)),
              const SizedBox(height: 6),
              const Text(
                  'Masuk untuk pengalaman belanja Dimsum Lumer yang lebih cepat dan personal.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: Colors.white70, fontSize: 11, height: 1.6)),
              const SizedBox(height: 18),
              const Row(children: [
                Expanded(
                    child: _Benefit(
                        icon: Icons.inventory_2_outlined,
                        label: 'Pantau pesanan')),
                SizedBox(width: 8),
                Expanded(
                    child: _Benefit(
                        icon: Icons.favorite_border_rounded,
                        label: 'Simpan favorit')),
                SizedBox(width: 8),
                Expanded(
                    child: _Benefit(
                        icon: Icons.auto_awesome_outlined,
                        label: 'Promo & poin')),
              ]),
              const SizedBox(height: 18),
              Row(children: [
                Expanded(
                    child: FilledButton.icon(
                        style: FilledButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFFFF7A00)),
                        onPressed: () => context.push('/login'),
                        icon: const Icon(Icons.login_rounded, size: 17),
                        label: const Text('Masuk'))),
                const SizedBox(width: 10),
                Expanded(
                    child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white54)),
                        onPressed: () => context.push('/login'),
                        icon: const Icon(Icons.person_add_alt_1_rounded,
                            size: 17),
                        label: const Text('Buat Akun'))),
              ]),
            ]),
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFFEDD5))),
            child: Column(children: [
              const Icon(Icons.auto_awesome_rounded, color: Color(0xFFFF7A00)),
              const SizedBox(height: 8),
              const Text('Lihat menu terlebih dahulu',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              const Text(
                  'Anda tetap dapat melihat seluruh produk dan harga sebelum masuk.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 10, height: 1.6, color: Color(0xFF6B7280))),
              const SizedBox(height: 12),
              FilledButton.icon(
                  style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF171717)),
                  onPressed: () => context.push('/products'),
                  iconAlignment: IconAlignment.end,
                  icon: const Icon(Icons.arrow_forward_rounded, size: 15),
                  label: const Text('Lihat Semua Menu')),
            ]),
          ),
          const Padding(
              padding: EdgeInsets.fromLTRB(12, 12, 12, 4),
              child: Text(
                  'Dengan masuk atau membuat akun, Anda menyetujui ketentuan layanan dan kebijakan privasi Dimsum Lumer.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      fontSize: 9, height: 1.5, color: Color(0xFF9CA3AF)))),
        ]),
      );
}

class _Benefit extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Benefit({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
        decoration: BoxDecoration(
            color: Colors.white10,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white12)),
        child: Column(children: [
          Icon(icon, size: 18, color: Colors.white),
          const SizedBox(height: 6),
          Text(label,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w600))
        ]),
      );
}
