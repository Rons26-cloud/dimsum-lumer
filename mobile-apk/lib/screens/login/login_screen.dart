import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../services/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  bool _register = false;
  bool _loading = false;
  bool _showPassword = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _loading) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (_register) {
        await AuthService.signUp(
            _email.text, _password.text, _name.text, _phone.text);
      } else {
        await AuthService.signIn(_email.text, _password.text);
      }
      if (mounted) context.go('/');
    } catch (error) {
      if (mounted) setState(() => _error = _friendly(error));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _friendly(Object error) {
    final message = error is AuthException ? error.message.toLowerCase() : '';
    if (message.contains('invalid login'))
      return 'Email atau kata sandi salah.';
    if (message.contains('network') || message.contains('socket'))
      return 'Koneksi internet bermasalah. Coba kembali.';
    if (error is FormatException) return error.message;
    return 'Permintaan tidak dapat diproses. Silakan coba kembali.';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: AutofillGroup(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Align(
                                alignment: Alignment.centerLeft,
                                child: IconButton(
                                    onPressed: () => context.canPop()
                                        ? context.pop()
                                        : context.go('/'),
                                    icon:
                                        const Icon(Icons.arrow_back_rounded))),
                            Center(
                                child: Image.asset('assets/logo.png',
                                    width: 76, height: 76)),
                            const SizedBox(height: 16),
                            Text(
                                _register ? 'Buat akun baru' : 'Selamat datang',
                                textAlign: TextAlign.center,
                                style:
                                    Theme.of(context).textTheme.headlineSmall),
                            const SizedBox(height: 6),
                            Text(
                                _register
                                    ? 'Satu akun untuk aplikasi dan website Dimsum Lumer.'
                                    : 'Masuk untuk melanjutkan pesananmu.',
                                textAlign: TextAlign.center,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyMedium
                                    ?.copyWith(
                                        color: Theme.of(context)
                                            .colorScheme
                                            .onSurfaceVariant)),
                            const SizedBox(height: 24),
                            if (_register) ...[
                              TextFormField(
                                  controller: _name,
                                  maxLength: 80,
                                  textInputAction: TextInputAction.next,
                                  autofillHints: const [AutofillHints.name],
                                  validator: (value) =>
                                      value == null || value.trim().length < 2
                                          ? 'Masukkan nama lengkap'
                                          : null,
                                  decoration: const InputDecoration(
                                      labelText: 'Nama lengkap',
                                      counterText: '',
                                      prefixIcon:
                                          Icon(Icons.person_outline_rounded))),
                              const SizedBox(height: 12),
                              TextFormField(
                                  controller: _phone,
                                  maxLength: 16,
                                  keyboardType: TextInputType.phone,
                                  textInputAction: TextInputAction.next,
                                  autofillHints: const [
                                    AutofillHints.telephoneNumber
                                  ],
                                  validator: (value) => value == null ||
                                          value
                                                  .replaceAll(RegExp(r'\D'), '')
                                                  .length <
                                              8
                                      ? 'Nomor HP tidak valid'
                                      : null,
                                  decoration: const InputDecoration(
                                      labelText: 'Nomor HP',
                                      counterText: '',
                                      prefixIcon: Icon(Icons.phone_outlined))),
                              const SizedBox(height: 12),
                            ],
                            TextFormField(
                                controller: _email,
                                maxLength: 254,
                                keyboardType: TextInputType.emailAddress,
                                textInputAction: TextInputAction.next,
                                autofillHints: const [AutofillHints.email],
                                validator: (value) => value != null &&
                                        RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
                                            .hasMatch(value.trim())
                                    ? null
                                    : 'Format email tidak valid',
                                decoration: const InputDecoration(
                                    labelText: 'Email',
                                    counterText: '',
                                    prefixIcon: Icon(Icons.email_outlined))),
                            const SizedBox(height: 12),
                            TextFormField(
                                controller: _password,
                                maxLength: 128,
                                obscureText: !_showPassword,
                                onFieldSubmitted: (_) => _submit(),
                                autofillHints: _register
                                    ? const [AutofillHints.newPassword]
                                    : const [AutofillHints.password],
                                validator: (value) =>
                                    value != null && value.length >= 8
                                        ? null
                                        : 'Minimal 8 karakter',
                                decoration: InputDecoration(
                                    labelText: 'Kata sandi',
                                    counterText: '',
                                    prefixIcon:
                                        const Icon(Icons.lock_outline_rounded),
                                    suffixIcon: IconButton(
                                        onPressed: () => setState(() =>
                                            _showPassword = !_showPassword),
                                        icon: Icon(_showPassword
                                            ? Icons.visibility_off_outlined
                                            : Icons.visibility_outlined)))),
                            if (_error != null)
                              Padding(
                                  padding: const EdgeInsets.only(top: 14),
                                  child: Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                          color: Theme.of(context)
                                              .colorScheme
                                              .errorContainer,
                                          borderRadius:
                                              BorderRadius.circular(12)),
                                      child: Text(_error!,
                                          textAlign: TextAlign.center,
                                          style: TextStyle(
                                              color: Theme.of(context)
                                                  .colorScheme
                                                  .onErrorContainer)))),
                            const SizedBox(height: 20),
                            FilledButton(
                                onPressed: _loading ? null : _submit,
                                child: _loading
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            color: Colors.white))
                                    : Text(_register
                                        ? 'Daftar dan masuk'
                                        : 'Masuk')),
                            const SizedBox(height: 8),
                            TextButton(
                                onPressed: _loading
                                    ? null
                                    : () => setState(() {
                                          _register = !_register;
                                          _error = null;
                                        }),
                                child: Text(_register
                                    ? 'Sudah punya akun? Masuk'
                                    : 'Belum punya akun? Daftar')),
                          ]),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
