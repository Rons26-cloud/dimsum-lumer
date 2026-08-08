# Supabase customer-data security

Apply `supabase_zero_trust_hardening.sql` **after all existing migrations** using
the Supabase SQL Editor or migration CLI. Test it in staging and back up the
database first because it intentionally replaces accumulated policies on the
sensitive customer tables.

## Access model

| Data | Anonymous | Logged-in customer | Admin / superadmin |
| --- | --- | --- | --- |
| Product/category/public promotion | Read public fields | Read | Manage through admin policies |
| Profile/address | None | Own rows only | All customer rows |
| Cart/wishlist | None | Own rows only | Read for support/audit |
| Orders/items | None | Own rows only | Read/update operational status |
| Notifications | None | Read own; only mark `is_read` | Manage |
| Activity logs | None | None | Read/create |

## Required operational settings

- Never place `service_role`, database passwords, private signing keys, or
  encryption secrets in `.env` bundled with Flutter. APK contents are readable.
- Keep the Supabase publishable/anon key in the app; it is designed to be public.
  RLS is the authorization boundary.
- Enable email confirmation, leaked-password protection, CAPTCHA, and appropriate
  authentication rate limits in Supabase Auth.
- Use MFA for every admin account. Do not assign admin roles from the client.
- Keep production debug logging disabled and rotate credentials immediately if a
  service-role key was ever shipped or committed.
- Run the Supabase security/linter advisors after applying the migration.

True end-to-end encryption would also prevent the database from calculating
orders and would require each intended reader to hold a decryption key. This app
instead uses TLS in transit, provider encryption at rest, and strict row/column
authorization: customers can read their own data, while only admins can access
all customers' data.
