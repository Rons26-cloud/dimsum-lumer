import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../security/input_validator.dart';
import '../../widgets/product_image.dart';

class GuestOrderScreen extends StatefulWidget {
  final Map<String, dynamic> product;
  const GuestOrderScreen({super.key, required this.product});

  @override
  State<GuestOrderScreen> createState() => _GuestOrderScreenState();
}

class _GuestOrderScreenState extends State<GuestOrderScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _notes = TextEditingController();
  String _shipping = 'pickup';
  String _payment = 'cod';
  int _quantity = 1;
  bool _sending = false;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _address.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<Position> _position() async {
    if (!await Geolocator.isLocationServiceEnabled())
      throw Exception('Aktifkan layanan lokasi.');
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied)
      permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever)
      throw Exception('Izin lokasi diperlukan untuk pesanan tamu.');
    return Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 20)));
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _sending = true);
    try {
      final position = await _position();
      final admin =
          (dotenv.env['ADMIN_WA_NUMBER'] ?? '').replaceAll(RegExp(r'\D'), '');
      if (admin.isEmpty)
        throw Exception('Nomor WhatsApp admin belum dikonfigurasi.');
      final price = num.tryParse('${widget.product['price']}') ?? 0;
      final total = price * _quantity;
      final message = '''Halo Admin Dimsum Lumer, saya ingin memesan tanpa akun.

Nama: ${InputValidator.fullName(_name.text)}
WhatsApp: ${InputValidator.phone(_phone.text)}
Produk: ${widget.product['name'] ?? 'Produk Dimsum'}
Jumlah: $_quantity
Pengiriman: $_shipping
Alamat: ${_shipping == 'pickup' ? 'Ambil sendiri' : _address.text.trim()}
Pembayaran: ${_payment.toUpperCase()}
Total: Rp${total.toStringAsFixed(0)}
Catatan: ${_notes.text.trim().isEmpty ? '-' : _notes.text.trim()}
Lokasi: https://www.google.com/maps?q=${position.latitude},${position.longitude}''';
      final uri = Uri.parse(
          'https://wa.me/$admin?text=${Uri.encodeComponent(message)}');
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication))
        throw Exception('WhatsApp tidak dapat dibuka.');
    } catch (error) {
      if (mounted)
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$error')));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final price = num.tryParse('${widget.product['price']}') ?? 0;
    return Scaffold(
      appBar: AppBar(title: const Text('Pesan Tanpa Login')),
      body: Form(
        key: _formKey,
        child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
            children: [
              Card(
                  child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Row(children: [
                        SizedBox(
                            width: 68,
                            height: 68,
                            child: ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: ProductImage(product: widget.product))),
                        const SizedBox(width: 12),
                        Expanded(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                              Text(
                                  '${widget.product['name'] ?? 'Produk Dimsum'}',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w800)),
                              Text('Rp${price.toStringAsFixed(0)} / item',
                                  style: const TextStyle(
                                      fontSize: 12, color: Colors.black54))
                            ])),
                        IconButton(
                            onPressed: _quantity > 1
                                ? () => setState(() => _quantity--)
                                : null,
                            icon: const Icon(Icons.remove_circle_outline)),
                        Text('$_quantity',
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                        IconButton(
                            onPressed: () => setState(() => _quantity++),
                            icon: const Icon(Icons.add_circle_outline)),
                      ]))),
              const SizedBox(height: 12),
              TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Nama pemesan'),
                  validator: (value) {
                    try {
                      InputValidator.fullName(value ?? '');
                      return null;
                    } catch (e) {
                      return '$e';
                    }
                  }),
              const SizedBox(height: 10),
              TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration:
                      const InputDecoration(labelText: 'Nomor WhatsApp'),
                  validator: (value) {
                    try {
                      InputValidator.phone(value ?? '');
                      return null;
                    } catch (e) {
                      return '$e';
                    }
                  }),
              const SizedBox(height: 16),
              const Text('Pengiriman',
                  style: TextStyle(fontWeight: FontWeight.w800)),
              SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'pickup', label: Text('Ambil')),
                    ButtonSegment(value: 'gojek', label: Text('Gojek')),
                    ButtonSegment(value: 'grab', label: Text('Grab'))
                  ],
                  selected: {
                    _shipping
                  },
                  onSelectionChanged: (value) =>
                      setState(() => _shipping = value.first)),
              if (_shipping != 'pickup') ...[
                const SizedBox(height: 10),
                TextFormField(
                    controller: _address,
                    maxLines: 3,
                    decoration:
                        const InputDecoration(labelText: 'Alamat lengkap'),
                    validator: (value) =>
                        _shipping != 'pickup' && (value ?? '').trim().length < 8
                            ? 'Alamat wajib diisi.'
                            : null)
              ],
              const SizedBox(height: 16),
              const Text('Cara Pembayaran Tamu',
                  style: TextStyle(fontWeight: FontWeight.w800)),
              const Text(
                  'Pembayaran dikonfirmasi langsung bersama admin melalui WhatsApp.',
                  style: TextStyle(fontSize: 11, color: Colors.black54)),
              SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(
                        value: 'cod',
                        icon: Icon(Icons.payments_outlined),
                        label: Text('Tunai')),
                    ButtonSegment(
                        value: 'transfer',
                        icon: Icon(Icons.account_balance_outlined),
                        label: Text('Transfer')),
                    ButtonSegment(
                        value: 'qris',
                        icon: Icon(Icons.qr_code_rounded),
                        label: Text('QRIS'))
                  ],
                  selected: {
                    _payment
                  },
                  onSelectionChanged: (value) =>
                      setState(() => _payment = value.first)),
              const SizedBox(height: 10),
              TextFormField(
                  controller: _notes,
                  maxLines: 2,
                  decoration:
                      const InputDecoration(labelText: 'Catatan (opsional)')),
              const SizedBox(height: 18),
              FilledButton.icon(
                  onPressed: _sending ? null : _send,
                  icon: _sending
                      ? const SizedBox.square(
                          dimension: 17,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.chat_rounded),
                  label: Text(_sending
                      ? 'Memverifikasi lokasi...'
                      : 'Kirim Pesanan via WhatsApp')),
            ]),
      ),
    );
  }
}
