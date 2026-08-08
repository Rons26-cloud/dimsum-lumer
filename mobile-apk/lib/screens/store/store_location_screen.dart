import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/supabase_realtime_service.dart';

class StoreLocationScreen extends StatelessWidget {
  const StoreLocationScreen({super.key});
  static const fallback = <String, dynamic>{
    'name': 'Dimsum Lumer - Hongkong Fashion',
    'address':
        'Hongkong Fashion, Jalan Sisingamangaraja, Sudirejo II, Medan Amplas, Kota Medan, Sumatera Utara 20147',
    'latitude': 3.570776,
    'longitude': 98.694665,
    'phone': '6288807597952',
    'open_time': '10:00',
    'close_time': '22:00',
  };

  @override
  Widget build(BuildContext context) {
    final store = {...fallback, ...RealtimeAppConfig.instance.storeInfo};
    final lat =
        num.tryParse('${store['latitude']}') ?? fallback['latitude'] as num;
    final lng =
        num.tryParse('${store['longitude']}') ?? fallback['longitude'] as num;
    final mapsUrl =
        Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng');
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        shadowColor: Colors.transparent,
        elevation: 0,
        title: const Text('Lokasi Toko'),
      ),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: AspectRatio(
                aspectRatio: 16 / 10,
                child: Image.network(
                    'https://maps.googleapis.com/maps/api/staticmap?center=$lat,$lng&zoom=16&size=800x500&markers=color:blue%7C$lat,$lng',
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                        color: const Color(0xFFF1F5F9),
                        child: const Center(
                            child: Icon(Icons.map_outlined,
                                size: 56, color: Color(0xFF64748B))))))),
        const SizedBox(height: 16),
        Card(
            child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        const CircleAvatar(
                            backgroundColor: Color(0xFFF1F5F9),
                            foregroundColor: Color(0xFF334155),
                            child: Icon(Icons.storefront_outlined)),
                        const SizedBox(width: 12),
                        Expanded(
                            child: Text('${store['name']}',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w800, fontSize: 16)))
                      ]),
                      const SizedBox(height: 14),
                      _info(Icons.location_on_outlined, '${store['address']}'),
                      _info(Icons.schedule_rounded,
                          '${store['open_time']}–${store['close_time']}'),
                      _info(Icons.phone_outlined, '${store['phone']}'),
                    ]))),
        const SizedBox(height: 12),
        OutlinedButton.icon(
            onPressed: () =>
                launchUrl(mapsUrl, mode: LaunchMode.externalApplication),
            icon: Image.network(
                'https://www.gstatic.com/images/branding/product/2x/maps_96in128dp.png',
                width: 20,
                height: 20),
            label: const Text('Buka di Google Maps')),
      ]),
    );
  }

  Widget _info(IconData icon, String text) => Padding(
      padding: const EdgeInsets.only(top: 9),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, size: 18, color: const Color(0xFF64748B)),
        const SizedBox(width: 10),
        Expanded(
            child: Text(text,
                style: const TextStyle(
                    fontSize: 12, height: 1.5, color: Color(0xFF475569))))
      ]));
}
