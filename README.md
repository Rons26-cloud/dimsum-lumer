# Dimsum Lumer

This repository contains the customer storefront, staff dashboard, Android app,
and Supabase database used by Dimsum Lumer.

## Projects

| Path | Purpose |
| --- | --- |
| `frontend-web` | React storefront and PWA |
| `admin-dashboard` | React operations dashboard |
| `mobile-apk` | Flutter Android client |
| `supabase` | Database schema, migrations, policies, and checks |
| `design-packaging` | Packaging artwork |

## Local setup

Node.js 22+, npm 10+, Flutter with Dart 3.3+, and an existing Supabase project
are required. Copy each `.env.example` to `.env` in the same directory and fill
in the local values. Environment files are ignored by Git.

Client applications may contain a Supabase publishable or legacy anonymous key.
Never place a service-role key, database password, signing key, or production
credential in a client environment file.

Install and run the web applications separately:

```powershell
cd frontend-web
npm install
npm run dev

cd ..\admin-dashboard
npm install
npm run dev
```

Run the Android client with Flutter:

```powershell
cd mobile-apk
flutter pub get
flutter run
```

## Checks

```powershell
cd frontend-web
npm run test:security
npm run build

cd ..\admin-dashboard
npm run test:security
npm run build

cd ..\mobile-apk
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test
```

## Android release

Copy `mobile-apk/android/key.properties.example` to
`mobile-apk/android/key.properties`, point it to the production keystore, then
run:

```powershell
cd mobile-apk
flutter build apk --release
```

The APK is written to `mobile-apk/build/app/outputs/flutter-apk/`.

## Database changes

Root migrations in `supabase/migrations` are the deployment history. SQL under
the application folders is feature-specific or historical and must not be run
blindly against production. Test migrations in staging, review RLS and function
permissions, then run `supabase/security_post_deploy_check.sql`.

Production hosting must use HTTPS, keep the dashboard separate from the public
storefront, and configure SPA fallback to `index.html` for both React apps.
