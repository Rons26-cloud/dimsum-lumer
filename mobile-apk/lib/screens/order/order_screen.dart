import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/supabase_service.dart';
import '../../widgets/app_state_view.dart';

class OrderScreen extends StatefulWidget {
  const OrderScreen({super.key});

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> {
  String _filter = 'all';
  bool _reordering = false;
  String _error = '';

  Future<void> _reorder(String orderId) async {
    if (_reordering) return;
    setState(() {
      _reordering = true;
      _error = '';
    });
    try {
      final raw = await SupabaseService.client
          .rpc('reorder_order', params: {'p_order_id': orderId});
      final result =
          raw is Map ? Map<String, dynamic>.from(raw) : <String, dynamic>{};
      final added = num.tryParse('${result['added_count'] ?? 0}') ?? 0;
      if (!mounted) return;
      if (added > 0) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text(
                '${result['message'] ?? 'Produk ditambahkan kembali ke keranjang.'}')));
        context.push('/cart');
      } else {
        setState(() => _error =
            '${result['message'] ?? 'Tidak ada produk yang dapat dipesan lagi.'}');
      }
    } catch (_) {
      if (mounted)
        setState(
            () => _error = 'Pesanan gagal dimasukkan kembali ke keranjang.');
    } finally {
      if (mounted) setState(() => _reordering = false);
    }
  }

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
                final orders = snapshot.data!.reversed.toList();
                if (orders.isEmpty)
                  return const AppStateView(
                      icon: Icons.receipt_long_outlined,
                      title: 'Belum ada pesanan',
                      message:
                          'Pesanan yang sudah dibuat akan tampil dan diperbarui secara realtime.');
                final visible = _filter == 'all'
                    ? orders
                    : orders
                        .where((order) => order['status'] == _filter)
                        .toList();
                final latestCompleted = orders
                    .where((order) => order['status'] == 'completed')
                    .firstOrNull;
                const filters = [
                  ('all', 'Semua'),
                  ('pending', 'Menunggu'),
                  ('processing', 'Diproses'),
                  ('shipping', 'Dikirim'),
                  ('completed', 'Selesai'),
                  ('cancelled', 'Batal')
                ];
                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
                  children: [
                    SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                            children: filters
                                .map((item) => Padding(
                                    padding: const EdgeInsets.only(right: 8),
                                    child: ChoiceChip(
                                        label: Text(item.$2),
                                        selected: _filter == item.$1,
                                        onSelected: (_) =>
                                            setState(() => _filter = item.$1))))
                                .toList())),
                    if (latestCompleted != null) ...[
                      const SizedBox(height: 12),
                      InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: _reordering
                              ? null
                              : () => _reorder('${latestCompleted['id']}'),
                          child: Container(
                              constraints: const BoxConstraints(minHeight: 52),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                  color: const Color(0xFFFFF7ED),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                      color: const Color(0xFFFFEDD5))),
                              child: Row(children: [
                                const Expanded(
                                    child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                      Text('Pesan lagi dari pesanan terakhir',
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: Color(0xFF7C2D12))),
                                      SizedBox(height: 2),
                                      Text(
                                          'Harga dan stok akan diperiksa kembali',
                                          style: TextStyle(
                                              fontSize: 9,
                                              color: Color(0xFFC2410C)))
                                    ])),
                                _reordering
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2))
                                    : const Icon(Icons.refresh_rounded,
                                        color: Color(0xFFFF7A00))
                              ]))),
                    ],
                    if (_error.isNotEmpty)
                      Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                  color: const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(14)),
                              child: Text(_error,
                                  style: const TextStyle(
                                      fontSize: 10, color: Colors.red)))),
                    const SizedBox(height: 12),
                    if (visible.isEmpty)
                      const AppStateView(
                          icon: Icons.inventory_2_outlined,
                          title: 'Belum ada pesanan',
                          message: 'Belum ada pesanan dengan status ini.')
                    else
                      ...visible.map((order) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _OrderCard(order: order))),
                  ],
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
