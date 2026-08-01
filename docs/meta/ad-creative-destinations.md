# Meta ad creative destinations

## Documentation status

The storage contract is based on the official Meta Marketing API
`v25.0` creative, dynamic creative and catalog-ad documentation
reviewed on 2026-08-01. The approved Supabase production
migration was applied to the pink-lens tracking project and read
back with active RLS, no public or Data API role grants, an active
retention job and zero initial rows. The application runtime
remains pending until its exact-SHA Vercel release and two
idempotency syncs are verified.

Primary Meta sources:

- `https://developers.facebook.com/docs/marketing-api/creative`
- `https://developers.facebook.com/docs/marketing-api/reference/ad-creative`
- `https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data`
- `https://developers.facebook.com/docs/marketing-api/dynamic-creative/dynamic-creative-optimization`
- `https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-link-url`
- `https://developers.facebook.com/docs/marketing-api/dynamic-ads/get-started`
- `https://developers.facebook.com/docs/marketing-api/reference/ad-account/activities`

## Boundary

`marketing.meta_ad_creative_destinations` is a separate read-only
configuration snapshot. It must not add a destination field to
`marketing.meta_ad_delivery_insights`, because Meta Insights does
not return a destination URL. Joining the two tables by
`account_id`, `ad_id` and a compatible observation period proves
that a configuration was visible when sampled. It does not prove
the exact URL delivered for an impression or click.

The snapshot stores the URL and URL tags separately. Dynamic
template and catalog destinations are therefore never flattened
into a fabricated resolved URL. `destination_url` and
`normalized_destination_url` remain `NULL` for catalog-only and
unresolved creatives. Documented app deeplinks use the separate
`deeplink` resolution status and retain a non-null destination
rather than being classified as a web URL or unresolved value.

## SCD and idempotency contract

Each extracted destination has a deterministic
`destination_fingerprint`. The complete ad and creative response
produces a deterministic `observed_version`. The unique key is:

`account_id, ad_id, creative_id, observed_version, destination_fingerprint`.

A retry of the same observed version updates `observed_through`;
it does not add a duplicate. When an explicitly fetched ad
returns a different version, the writer closes the prior rows
with `observed_until` and inserts the new version. Absence from a
partial fetch must not close a version.

`observed_from`, `observed_through` and `observed_until` are
application observation boundaries. They are not Meta delivery
boundaries. `effective_from` and `effective_until` remain
nullable and use an explicit `effective_period_basis`:

- `unknown`: both effective timestamps are `NULL`;
- `meta_activity`: `effective_from` is backed by a validated Meta
  activity event, and `effective_until` is optional until the
  next validated boundary.

`ad_updated_time` is stored as provider metadata but must not by
itself be promoted to an effective creative-change timestamp.

## Privacy, access and retention

The table has deny-by-default RLS and no grants for `public`,
`anon`, `authenticated` or `service_role`. It contains
configuration metadata only; raw Graph responses and access
tokens are forbidden.

Rows expire 14 months after `observed_through`, unless
`ops.has_active_privacy_retention_exception` records an active
exception. The retention migration fails closed if `pg_cron` is
unavailable.

## Release verification

Before the snapshot can be described as active:

1. Apply the migration through the approved Supabase deployment
   gate.
2. Read back the table, RLS state, grants, retention function and
   cron job.
3. Run an authorized read-only sync twice and prove the second
   run updates `observed_through` without duplicate unique keys.
4. Change or fixture a creative version and prove the previous
   rows close before the new version becomes current.
5. Verify static, template, deeplink, catalog-dynamic and
   unresolved examples.
6. Confirm that Insights remains unchanged and that joins retain
   the separate configuration-versus-delivery evidence classes.
