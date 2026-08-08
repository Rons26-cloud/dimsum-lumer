import 'package:flutter_test/flutter_test.dart';
import 'package:dimsum_lumer/security/input_validator.dart';
import 'package:dimsum_lumer/security/safe_error.dart';

void main() {
  group('InputValidator', () {
    test('normalizes safe identity fields', () {
      expect(InputValidator.email(' User@Example.COM '), 'user@example.com');
      expect(InputValidator.phone('+62 812-3456-7890'), '+6281234567890');
      expect(InputValidator.fullName('  Budi   Santoso  '), 'Budi Santoso');
    });

    test('rejects malformed identifiers and unsafe values', () {
      expect(() => InputValidator.uuid('1 OR 1=1'), throwsFormatException);
      expect(() => InputValidator.quantity(1000), throwsFormatException);
      expect(() => InputValidator.variant('<script>alert(1)</script>'),
          throwsFormatException);
    });

    test('accepts a valid UUID', () {
      expect(InputValidator.uuid('550e8400-e29b-41d4-a716-446655440000'),
          '550e8400-e29b-41d4-a716-446655440000');
    });
  });

  group('SafeError', () {
    test('does not expose internal database messages', () {
      final result = SafeError.message(Exception(
          'PostgrestException relation public.secret_table does not exist, SQLSTATE 42P01'));
      expect(result, isNot(contains('secret_table')));
      expect(result, isNot(contains('42P01')));
    });
  });
}
