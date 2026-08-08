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
      body: ListView(padding: const EdgeInsets.all(16), children: [
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
                    Text(user?.userMetadata?['full_name'] ?? 'Pelanggan Dimsum',
                        style: const TextStyle(
                            color: Colors.white, fontWeight: FontWeight.bold)),
                    Text(user?.email ?? 'Silakan masuk',
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 12))
                  ]))
            ])),
        const SizedBox(height: 16),
        Card(
            child: Column(children: [
          _tile(Icons.storefront_outlined, 'Lokasi Toko',
              onTap: () => context.push('/store-location')),
          _tile(Icons.favorite_border, 'Favorit'),
          _tile(Icons.workspace_premium_outlined, 'Poin & Reward'),
          _tile(Icons.help_outline, 'Bantuan'),
        ])),
        const SizedBox(height: 16),
        if (user == null)
          FilledButton(
              onPressed: () => context.push('/login'),
              child: const Text('Masuk / Daftar'))
        else
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
