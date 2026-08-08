import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/supabase_service.dart';
import '../../widgets/app_state_view.dart';

class OrderScreen extends StatelessWidget {
  const OrderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final userId = SupabaseService.client.auth.currentUser?.id;
    return Scaffold(
      appBar: AppBar(title: const Text('Pesanan Saya')),
      body: userId == null
          ? AppStateView(
              icon: Icons.lock_outline_rounded,
              title: 'Masuk untuk melihat pesanan',
              message: 'Status transaksi dan pengiriman akan tampil di sini.',
              actionLabel: 'Masuk / Daftar',
              onAction: () => context.push('/login'))
          : StreamBuilder<List<Map<String, dynamic>>>(
              stream: SupabaseService.client
                  .from('orders')
                  .stream(primaryKey: ['id'])
                  .eq('user_id', userId)
                  .order('created_at'),
              builder: (context, snapshot) {
                if (snapshot.hasError)
                  return const AppStateView(
                      icon: Icons.cloud_off_rounded,
                      title: 'Pesanan belum dapat dimuat',
                      message: 'Periksa koneksi lalu coba kembali.');
                if (!snapshot.hasData) return const AppLoadingView();
                final orders = snapshot.data!;
                if (orders.isEmpty)
                  return const AppStateView(
                      icon: Icons.receipt_long_outlined,
                      title: 'Belum ada pesanan',
                      message:
                          'Pesanan yang sudah dibuat akan tampil dan diperbarui secara realtime.');
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
                  itemCount: orders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 12),
                  itemBuilder: (context, index) =>
                      _OrderCard(order: orders[index]),
                );
              },
            ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Map<String, dynamic> order;
  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final status = '${order['status'] ?? 'pending'}';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(13)),
                child: Icon(Icons.shopping_bag_outlined,
                    color: Theme.of(context).colorScheme.primary)),
            const SizedBox(width: 12),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text('${order['order_code'] ?? 'Pesanan'}',
                      style: const TextStyle(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 2),
                  Text(_statusLabel(status),
                      style: TextStyle(
                          fontSize: 12,
                          color: status == 'cancelled'
                              ? Colors.red
                              : Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w700))
                ])),
            Text(_money(order['total_amount'] ?? order['total']),
                style: const TextStyle(fontWeight: FontWeight.w800))
          ]),
          const SizedBox(height: 14),
          _OrderProgress(status: status),
        ]),
      ),
    );
  }
}

class _OrderProgress extends StatelessWidget {
  final String status;
  const _OrderProgress({required this.status});
  static const steps = ['pending', 'processing', 'shipping', 'completed'];

  @override
  Widget build(BuildContext context) {
    final active = steps.indexOf(status);
    final cancelled = status == 'cancelled';
    return Row(
        children: List.generate(
            steps.length,
            (index) => Expanded(
                child: Container(
                    margin: EdgeInsets.only(
                        right: index == steps.length - 1 ? 0 : 4),
                    height: 5,
                    decoration: BoxDecoration(
                        color: !cancelled && index <= active
                            ? Theme.of(context).colorScheme.primary
                            : const Color(0xFFE9E2DC),
                        borderRadius: BorderRadius.circular(10))))));
  }
}

String _statusLabel(String status) =>
    const {
      'pending': 'Menunggu konfirmasi',
      'processing': 'Sedang diproses',
      'shipping': 'Dalam pengiriman',
      'completed': 'Pesanan selesai',
      'cancelled': 'Dibatalkan'
    }[status] ??
    'Status diperbarui';
String _money(Object? value) =>
    'Rp${(num.tryParse('$value') ?? 0).toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => '.')}';
