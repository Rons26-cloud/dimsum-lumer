import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/notification_service.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifikasi',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        actions: [
          TextButton.icon(
            onPressed: NotificationService.markAllAsRead,
            icon: const Icon(Icons.done_all_rounded, size: 18),
            label: const Text('Baca semua',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
          ),
          IconButton(
            tooltip: 'Hapus semua',
            color: Colors.redAccent,
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                    context: context,
                    builder: (dialogContext) => AlertDialog(
                      title: const Text('Hapus semua notifikasi?'),
                      content: const Text(
                          'Notifikasi yang dihapus tidak dapat dikembalikan.'),
                      actions: [
                        TextButton(
                            onPressed: () =>
                                Navigator.pop(dialogContext, false),
                            child: const Text('Batal')),
                        FilledButton(
                            onPressed: () => Navigator.pop(dialogContext, true),
                            child: const Text('Hapus')),
                      ],
                    ),
                  ) ??
                  false;
              if (confirmed) await NotificationService.deleteAll();
            },
            icon: const Icon(Icons.delete_outline_rounded, size: 19),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        stream: NotificationService.watchNotifications(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return const Center(
                child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Text(
                        'Notifikasi belum dapat dimuat. Periksa koneksi lalu coba kembali.',
                        textAlign: TextAlign.center)));
          }
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final notifications = snapshot.data ?? [];
          if (notifications.isEmpty) {
            return const Center(
                child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.notifications_none_rounded,
                          size: 52, color: Colors.grey),
                      SizedBox(height: 12),
                      Text('Belum ada notifikasi',
                          style: TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w700)),
                      SizedBox(height: 5),
                      Text(
                          'Informasi pesanan, promo, dan akun akan tampil di sini.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11, color: Colors.grey))
                    ])));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(14),
            itemCount: notifications.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final item = notifications[index];
              final isRead = item['is_read'] == true;
              final createdAt =
                  DateTime.tryParse(item['created_at']?.toString() ?? '');
              return Material(
                color: isRead ? Colors.white : const Color(0xFFFFF8F2),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(18),
                    side: BorderSide(
                        color: isRead
                            ? const Color(0xFFF1F1F1)
                            : const Color(0xFFFFE8D1))),
                child: InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: isRead
                      ? null
                      : () =>
                          NotificationService.markAsRead(item['id'].toString()),
                  child: Padding(
                    padding: const EdgeInsets.all(13),
                    child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                              width: 42,
                              height: 42,
                              decoration: BoxDecoration(
                                  color: isRead
                                      ? const Color(0xFFF3F3F3)
                                      : const Color(0xFFFF7A00),
                                  borderRadius: BorderRadius.circular(13)),
                              child: Icon(Icons.notifications_none_rounded,
                                  size: 20,
                                  color: isRead ? Colors.grey : Colors.white)),
                          const SizedBox(width: 12),
                          Expanded(
                              child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                Row(children: [
                                  Expanded(
                                      child: Text(
                                          item['title']?.toString() ??
                                              'Dimsum Lumer',
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800))),
                                  if (!isRead)
                                    const Padding(
                                        padding: EdgeInsets.only(left: 8),
                                        child: CircleAvatar(
                                            radius: 4,
                                            backgroundColor: Color(0xFFFF7A00)))
                                ]),
                                const SizedBox(height: 4),
                                Text(item['message']?.toString() ?? '',
                                    maxLines: 3,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 11,
                                        height: 1.45,
                                        color: Colors.grey)),
                                if (createdAt != null) ...[
                                  const SizedBox(height: 7),
                                  Text(
                                      DateFormat('dd MMM yyyy, HH:mm')
                                          .format(createdAt.toLocal()),
                                      style: const TextStyle(
                                          fontSize: 9, color: Colors.grey))
                                ],
                              ])),
                        ]),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
