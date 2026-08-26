# Dimsum Lumer Android app

Flutter wrapper and native screens for the Dimsum Lumer customer app.

## Setup

Create `.env` from `.env.example`:

```env
SUPABASE_URL=https://example.supabase.co
SUPABASE_ANON_KEY=your-publishable-key
ADMIN_WA_NUMBER=628xxxxxxxxxx
```

Only use a Supabase publishable or legacy anonymous key here. APK contents can
be inspected, so service-role keys and other server credentials do not belong in
this file.

```powershell
flutter pub get
flutter run
```

## Validation

```powershell
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
```

## Release APK

The release build requires the existing production keystore. Copy
`android/key.properties.example` to `android/key.properties` and set its values
without committing either the keystore or `key.properties`.

```powershell
flutter build apk --release
```

The current package is `com.dimsumlumer.dimsum_lumer`. Keep this ID and the same
signing key for updates to an installed app. Increase the version in
`pubspec.yaml` before every release.

## Web content and OAuth

The primary customer experience loads from `https://dimsum-lumerr.pages.dev`.
Trusted hosts are defined in `lib/config/app_config.dart`. If the production
domain changes, update the URL and host there before building a new APK.

Google sign-in returns through
`io.dimsumlumer.app://login-callback/`. Register that URL in Supabase Auth and
enable the Google provider in the Supabase project.
