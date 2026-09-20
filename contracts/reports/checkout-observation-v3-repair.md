# Checkout observation v3 storage repair — 2026-09-20

## Cause and scope

Production PostgreSQL rejected checkout observations at 06:33–06:34 UTC and
08:00–08:03 UTC with `shopify_checkout_observations_schema_version_check`.
The app and Shopify pixel support schema version 3; the table allowed only 1/2.
The receiver maps this persistence failure to HTTP 503 `storage_unavailable`.
Pixel delivery retries once, so HTTP failure counts are not unique customer counts.

Migration `20260920081500_allow_shopify_checkout_observation_v3.sql` only widens
the version check to 1/2/3. It validates the replacement before removing the old
constraint. No rows, permissions, RLS, retention, event shapes or provider settings
are changed. The declarative schema and SQL regression suite match this contract.

## Verification

- Before modification: local/remote migration history matched; dry-run had no work.
- New dry-run included only the v3 migration.
- Production SQL regression before repair: only v3 acceptance failed (19/20 pass).
- Migration plus SQL suite in a rolled-back transaction: 20/20 pass.
- Migration applied with explicit operator approval; readback confirms a validated
  `schema_version IN (1,2,3)` constraint and the exact migration version.
- Post-migration SQL suite: 20/20 pass, transaction rolled back; no test rows retained.
- Post-migration linked dry-run: no pending migrations.
- Linked lint for ops/marketing/commerce/analytics: no schema errors, before and after.
- Targeted TypeScript tests: 18/18 pass; typegen, typecheck and edge typecheck pass.
- Production build succeeds. One Shopify catalog fetch timed out during the build
  and used the existing presentation fallback; this is not evidence of checkout failure.
- Production tracking gateway smoke passes (loader 200; health 200/no-store/MISS).
- Full real-checkout-to-provider verification remains distinct from SQL acceptance;
  no synthetic advertising conversion or payment is authorized by this regression test.

## Separate recovery response

A fresh production OPTIONS request to `/api/shopify/checkout-recovery-evidence`
returns 404 with `receiver_disabled`. The feature flag is checked before OPTIONS.
This is separate from the observation storage failure. Recovery activation and
email delivery were not changed or enabled.

## Evidence limits

Rejected observations were not stored by these attempts. The pixel's two-attempt
delivery helper has no durable retry queue; historical event recovery is not proven.
Database tests do not establish provider acceptance, attribution or purchase delivery.
