# Mobile data access

`supabase_zero_trust_hardening.sql` consolidates the customer-facing policies
used by the mobile app. Apply it only after the earlier migrations, first in a
staging project.

Customer profiles, addresses, carts, wishlists, orders, and notifications are
owner-scoped. Admin access requires the server-side admin checks defined by the
project migrations. Public catalog data remains readable without an account.

The APK contains a Supabase publishable key by design; RLS is the authorization
boundary. Service-role keys, database passwords, signing keys, and encryption
secrets must stay in server or CI secret storage.

After applying policy changes, run the Supabase security advisors and the
repository post-deployment checks with anonymous, customer, admin, and AAL2
admin sessions.
