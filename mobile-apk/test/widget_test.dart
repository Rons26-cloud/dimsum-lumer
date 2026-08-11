import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:dimsum_lumer/config/app_config.dart';
import 'package:dimsum_lumer/theme/app_theme.dart';

void main() {
  testWidgets('renders the Dimsum Lumer application shell',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        title: AppConfig.appName,
        theme: AppTheme.light,
        home: Scaffold(
          appBar: AppBar(title: const Text(AppConfig.appName)),
          body: const Center(
            child: Text(AppConfig.tagline),
          ),
        ),
      ),
    );

    expect(find.text(AppConfig.appName), findsOneWidget);
    expect(find.text(AppConfig.tagline), findsOneWidget);
    expect(find.byType(Scaffold), findsOneWidget);

    final MaterialApp app = tester.widget(find.byType(MaterialApp));
    expect(app.theme?.colorScheme.primary, AppTheme.primary);
  });
}
