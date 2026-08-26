import 'dart:async';

import 'package:dimsum_lumer/services/app_config_service.dart';
import 'package:flutter_test/flutter_test.dart';

AppUpdateInfo update({
  bool enabled = true,
  int latest = 7,
  int minimum = 6,
  bool forced = false,
}) => AppUpdateInfo(
      updateEnabled: enabled,
      latestVersion: '1.2.4',
      latestBuild: latest,
      minimumBuild: minimum,
      forceUpdate: forced,
      downloadUrl: 'https://play.google.com/store/apps/details?id=com.dimsumlumer.dimsum_lumer',
      releaseTitle: 'Update Dimsum Lumer',
      releaseNotes: const [],
    );

void main() {
  test('does not update when installed build equals latest build', () {
    expect(update().decisionFor(7), AppUpdateDecision.none);
  });

  test('offers an optional update below latest build', () {
    expect(update().decisionFor(6), AppUpdateDecision.optional);
  });

  test('requires update below minimum build', () {
    expect(update(minimum: 7).decisionFor(6), AppUpdateDecision.required);
  });

  test('requires update when release is forced', () {
    expect(update(forced: true).decisionFor(6), AppUpdateDecision.required);
  });

  test('does not update when update management is disabled', () {
    expect(update(enabled: false).decisionFor(1), AppUpdateDecision.none);
  });

  test('network timeout fails open without hanging', () async {
    final result = await AppUpdateService.resolve(
      installedBuild: 6,
      loader: () => Completer<Map<String, dynamic>?>().future,
      timeout: const Duration(milliseconds: 20),
    );
    expect(result.decision, AppUpdateDecision.none);
    expect(result.update, isNull);
  });

  test('rejects unsafe download URLs', () {
    expect(AppUpdateService.isAllowedDownloadUrl('javascript:alert(1)'), isFalse);
    expect(AppUpdateService.isAllowedDownloadUrl('http://example.com/app.apk'), isFalse);
    expect(AppUpdateService.isAllowedDownloadUrl('https://play.google.com/store/apps/details?id=other.app'), isFalse);
  });
}
