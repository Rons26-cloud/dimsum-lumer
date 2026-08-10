import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';

import '../../services/supabase_service.dart';
import '../../security/safe_error.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _address = TextEditingController();
  final _promo = TextEditingController();
  String _shipping = 'gojek';
  String _payment = 'transfer';
  bool _agreed = false;
  bool _loading = true;
  bool _saving = false;
  List<Map<String, dynamic>> _items = [];
  String _error = '';
  String _promoError = '';
  Map<String, dynamic>? _appliedPromo;
  bool _checkingPromo = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _address.dispose();
    _promo.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final user = SupabaseService.client.auth.currentUser;
    if (user == null) {
      if (mounted) context.go('/login');
      return;
    }
    try {
      final rows = await SupabaseService.client
          .from('cart_items')
          .select(
              'id,product_id,quantity,variant,flash_sale_id,products(id,name,price)')
          .eq('user_id', user.id)
          .order('created_at');
      if (mounted)
        setState(() {
          _items = List<Map<String, dynamic>>.from(rows);
          _loading = false;
        });
    } catch (_) {
      if (mounted)
        setState(() {
          _error = 'Keranjang gagal dimuat.';
          _loading = false;
        });
    }
  }

  Future<Position> _position() async {
    if (!await Geolocator.isLocationServiceEnabled())
      throw Exception('Aktifkan layanan lokasi untuk checkout.');
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied)
      permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever)
      throw Exception('Izin lokasi diperlukan untuk pengiriman.');
    return Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 20)));
  }

  num get _subtotal => _items.fold<num>(0, (sum, row) {
        final product = row['products'] as Map<String, dynamic>? ?? {};
        return sum +
            (num.tryParse('${product['price']}') ?? 0) *
                (int.tryParse('${row['quantity']}') ?? 1);
      });
  num get _shippingCost =>
      _shipping == 'pickup' ? 0 : (_shipping == 'gojek' ? 15000 : 17000);
  num get _insuranceCost =>
      _items.isNotEmpty && _shipping != 'pickup' ? 3000 : 0;
  num get _discount =>
      num.tryParse('${_appliedPromo?['discount_amount'] ?? 0}') ?? 0;

  Future<void> _applyPromo() async {
    final code = _promo.text.trim();
    if (code.isEmpty || _checkingPromo) return;
    setState(() {
      _checkingPromo = true;
      _promoError = '';
    });
    try {
      final raw = await SupabaseService.client
          .from('promos')
          .select()
          .ilike('code', code)
          .maybeSingle();
      if (raw == null || raw['is_active'] == false) {
        throw Exception('Kode promo tidak ditemukan atau sudah tidak aktif.');
      }
      final now = DateTime.now();
      final starts = DateTime.tryParse('${raw['starts_at'] ?? ''}');
      final ends = DateTime.tryParse('${raw['ends_at'] ?? ''}');
      if (starts != null && starts.isAfter(now))
        throw Exception('Promo belum dimulai.');
      if (ends != null && ends.isBefore(now))
        throw Exception('Promo sudah berakhir.');
      final minimum = num.tryParse('${raw['min_purchase'] ?? 0}') ?? 0;
      if (_subtotal < minimum)
        throw Exception('Minimum belanja ${_money(minimum)}.');
      final limit = num.tryParse('${raw['usage_limit']}');
      final used = num.tryParse('${raw['used_count'] ?? 0}') ?? 0;
      if (limit != null && used >= limit)
        throw Exception('Kuota promo sudah habis.');
      final value =
          num.tryParse('${raw['discount_value'] ?? raw['discount'] ?? 0}') ?? 0;
      num discount = raw['discount_type'] == 'percentage'
          ? _subtotal * value / 100
          : value;
      final maximum = num.tryParse('${raw['max_discount']}');
      if (maximum != null && discount > maximum) discount = maximum;
      if (discount > _subtotal) discount = _subtotal;
      setState(() => _appliedPromo = {...raw, 'discount_amount': discount});
    } catch (error) {
      setState(() {
        _appliedPromo = null;
        _promoError = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _checkingPromo = false);
    }
  }

  Future<void> _checkout() async {
    if (_items.isEmpty || _address.text.trim().length < 8 || !_agreed) {
      setState(() => _error = 'Lengkapi alamat dan persetujuan pembayaran.');
      return;
    }
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      final position = await _position();
      final payload = _items
          .map((row) => {
                'product_id': row['product_id'],
                'quantity': row['quantity'],
                'variant': row['variant'] ?? 'Original',
                'flash_sale_id': row['flash_sale_id']
              })
          .toList();
      final result =
          await SupabaseService.client.rpc('checkout_order_v2', params: {
        'p_shipping_cost': _shippingCost + _insuranceCost,
        'p_shipping_method': _shipping,
        'p_payment_method': _payment,
        'p_shipping_address': _address.text.trim(),
        'p_customer_lat': position.latitude,
        'p_customer_lng': position.longitude,
        'p_items': payload,
        'p_promo_code': _appliedPromo?['code']
      });
      final order = result is Map ? result : <String, dynamic>{};
      if (!mounted) return;
      await showDialog<void>(
          context: context,
          builder: (context) => AlertDialog(
                icon: const Icon(Icons.check_circle_rounded,
                    color: Colors.green, size: 42),
                title: const Text('Pesanan berhasil'),
                content: Text(_payment == 'cod'
                    ? 'Pesanan ${order['order_code'] ?? ''} akan dibayar saat diterima.'
                    : 'Pesanan ${order['order_code'] ?? ''} tersimpan. Lanjutkan pembayaran $_payment sesuai instruksi toko.'),
                actions: [
                  FilledButton(
                      onPressed: () {
                        Navigator.pop(context);
                        context.go('/');
                      },
                      child: const Text('Kembali ke Beranda'))
                ],
              ));
    } catch (error) {
      if (mounted)
        setState(() => _error = SafeError.message(error,
            fallback: 'Checkout gagal diproses. Silakan coba kembali.'));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout Aman')),
      body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 120),
          children: [
            Text('${_items.length} produk',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ..._items.map((row) {
              final product = row['products'] as Map<String, dynamic>? ?? {};
              return Card(
                  child: ListTile(
                      title: Text('${product['name'] ?? 'Produk'}'),
                      subtitle: Text(
                          '${row['variant'] ?? 'Original'} · ${row['quantity']} item'),
                      trailing: Text(
                          _money((num.tryParse('${product['price']}') ?? 0) *
                              (int.tryParse('${row['quantity']}') ?? 1)),
                          style:
                              const TextStyle(fontWeight: FontWeight.bold))));
            }),
            const SizedBox(height: 14),
            TextField(
                controller: _address,
                maxLines: 3,
                decoration: const InputDecoration(
                    labelText: 'Alamat lengkap',
                    prefixIcon: Icon(Icons.location_on_outlined))),
            const SizedBox(height: 16),
            const Text('Pengiriman',
                style: TextStyle(fontWeight: FontWeight.w800)),
            SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'gojek', label: Text('Gojek')),
                  ButtonSegment(value: 'grab', label: Text('Grab')),
                  ButtonSegment(value: 'pickup', label: Text('Ambil'))
                ],
                selected: {
                  _shipping
                },
                onSelectionChanged: (value) => setState(() {
                      _shipping = value.first;
                      if (_shipping == 'pickup') _payment = 'cod';
                    })),
            const SizedBox(height: 16),
            Card(
                child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(children: [
                            Icon(Icons.local_offer_outlined,
                                size: 18, color: Color(0xFFFF7A00)),
                            SizedBox(width: 8),
                            Text('Voucher Promo',
                                style: TextStyle(fontWeight: FontWeight.w800))
                          ]),
                          const SizedBox(height: 4),
                          const Text(
                              'Diskon diverifikasi kembali oleh Supabase.',
                              style: TextStyle(
                                  fontSize: 10, color: Colors.black45)),
                          const SizedBox(height: 12),
                          if (_appliedPromo != null)
                            Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                    color: const Color(0xFFECFDF5),
                                    borderRadius: BorderRadius.circular(12)),
                                child: Row(children: [
                                  Expanded(
                                      child: Text(
                                          '${_appliedPromo?['code']} berhasil dipakai',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w700,
                                              color: Color(0xFF047857)))),
                                  IconButton(
                                      onPressed: () => setState(() {
                                            _appliedPromo = null;
                                            _promo.clear();
                                            _promoError = '';
                                          }),
                                      icon: const Icon(Icons.close_rounded,
                                          size: 18))
                                ]))
                          else
                            Row(children: [
                              Expanded(
                                  child: TextField(
                                      controller: _promo,
                                      textCapitalization:
                                          TextCapitalization.characters,
                                      decoration: const InputDecoration(
                                          hintText: 'Masukkan kode promo'))),
                              const SizedBox(width: 8),
                              FilledButton(
                                  style: FilledButton.styleFrom(
                                      backgroundColor: const Color(0xFF171717)),
                                  onPressed:
                                      _checkingPromo ? null : _applyPromo,
                                  child: _checkingPromo
                                      ? const SizedBox(
                                          width: 16,
                                          height: 16,
                                          child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              color: Colors.white))
                                      : const Text('Gunakan'))
                            ]),
                          if (_promoError.isNotEmpty)
                            Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(_promoError,
                                    style: const TextStyle(
                                        fontSize: 10, color: Colors.red))),
                        ]))),
            const SizedBox(height: 16),
            const Text('Metode Pembayaran Akun',
                style: TextStyle(fontWeight: FontWeight.w800)),
            const Text(
                'Pesanan tersimpan di akun dan dapat dilacak dari menu Pesanan.',
                style: TextStyle(fontSize: 11, color: Colors.black54)),
            Wrap(
                spacing: 8,
                children: ['transfer', 'qris', 'gopay', 'ovo', 'dana', 'cod']
                    .map((method) => ChoiceChip(
                        label: Text(method.toUpperCase()),
                        selected: _payment == method,
                        onSelected: (_) => setState(() => _payment = method)))
                    .toList()),
            CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: _agreed,
                onChanged: (value) => setState(() => _agreed = value ?? false),
                title: const Text(
                    'Saya menyetujui detail pesanan dan pembayaran.',
                    style: TextStyle(fontSize: 12))),
            if (_error.isNotEmpty)
              Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(12)),
                  child: Text(_error,
                      style:
                          TextStyle(color: Colors.red.shade700, fontSize: 12))),
          ]),
      bottomNavigationBar: SafeArea(
          top: false,
          child: Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFEFE8E2)))),
              child: Row(children: [
                Expanded(
                    child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      const Text('Total pembayaran',
                          style: TextStyle(fontSize: 10)),
                      Text(
                          _money(_subtotal +
                              _shippingCost +
                              _insuranceCost -
                              _discount),
                          style: const TextStyle(
                              fontWeight: FontWeight.w900,
                              color: Color(0xFFFF7A00)))
                    ])),
                FilledButton(
                    onPressed: _saving ? null : _checkout,
                    child: Text(_saving ? 'Memproses...' : 'Buat Pesanan'))
              ]))),
    );
  }
}

String _money(num value) =>
    'Rp${value.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (match) => '.')}';
