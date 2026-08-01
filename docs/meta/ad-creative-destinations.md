# Meta ad creative destinations

## Documentation status

The storage contract is based on the official Meta Marketing API
`v25.0` creative, dynamic creative and catalog-ad documentation
reviewed on 2026-08-01. The approved Supabase production
migration was applied to the pink-lens tracking project and read
back with active RLS, no public or Data API role grants, an active
retention job and zero initial rows. The application runtime was
released and production-verified on 2026-08-01.

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

## Production verification

The clean `codex/meta-click-to-landing` commit
`cbfa60f6f946bf2290a08f6a5f3ee848939289c7` was built as Vercel
deployment `dpl_2byUaVfETVh1fTFyEkrDdZtTC7BH` and promoted to
`utekos.no` on 2026-08-01. The Vercel build passed TypeScript and
generated 134 of 134 static pages. Post-promotion checks returned
HTTP 200 for `/skreddersy-varmen`, `/comfyrobe`,
`/skreddersy-varmen/utekos-orginal` and a product route, with no
deployment error logs or 5xx request logs in the release window.

`src/components/analytics/VercelTelemetry.tsx` remained unchanged
in the release. Its checked SHA-256 was
`1aec7e5c586a29baa55e4bc7e191317e309a201ca85e3f8246d32b81c9499938`.
Both `/_vercel/insights/script.js` and
`/_vercel/speed-insights/script.js` returned HTTP 200 before and
after promotion.

Two authorized production syncs completed at
`2026-08-01T15:20:19.054Z` and `2026-08-01T15:20:34.192Z`. Each
returned 437 Insights rows and 14 creative-destination
observations. The Supabase readback contained 14 rows and 14
unique observations across five ads and five creatives. All rows
retained the first timestamp in `observed_from`, advanced
`observed_through` to the second timestamp and remained open with
`observed_until IS NULL`.

Ad `120246491016410788` produced two active asset-feed observations
for creative `2134034140490187`. Both normalized to
`https://utekos.no/skreddersy-varmen`. This proves the sampled Meta
creative configuration, not the destination delivered for any
historical impression or click.

## Release verification contract

The active release is governed by these checks:

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
