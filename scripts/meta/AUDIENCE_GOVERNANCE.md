# Audience governance v1

Internal operations only. No storefront route, cron, ad activation, or automatic relabeling is installed.
Graph calls are pinned to v26.0. The locally installed Meta Business SDK is 26.0.1.

## Commands

Activate the repository's Node runtime first. All commands run from `main`.

```sh
source "$HOME/.nvm/nvm.sh" && nvm use --silent
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx -r dotenv/config scripts/meta/audit-audiences.ts
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx -r dotenv/config scripts/meta/persist-audience-registry.ts --file=<private-registry.json>
DOTENV_CONFIG_PATH=.env.local pnpm exec tsx -r dotenv/config scripts/meta/persist-audience-registry.ts --file=<private-registry.json> --apply
pnpm exec tsx scripts/meta/prepare-audience-review.ts <private-registry.json>
pnpm exec tsx --test src/lib/meta-audiences/*.test.ts supabase/migrations/meta_audience_registry.test.ts
```

`audit-audiences` reads the eight reviewed partitions under `~/Lister`, reads current Shopify profiles in memory, and reads Meta audience/adset/rule metadata with pagination. Generated reports go to a new private directory under `Lister/Meta-audience-governance`. No customer rows are emitted, persisted in the repository, or uploaded to Meta. Phone support is deliberately limited to ordinary Norwegian eight-digit national numbers beginning 2–9; other formats are quarantined, not repaired or declared rejected by Meta. E-mail matching is exact after trim/lowercase. Names and postcodes are never automatic identity keys.

An unmatched profile remains **unknown buyer status**, because offline and alternate-identifier coverage may be incomplete. Shopify `numberOfOrders > 0` identifies a profile with orders; it is not independent evidence that every historical order was paid, retained or profitable. Value-based audience metadata is not proof of a validated customer-value model.

`persist-audience-registry` is plan-only unless `--apply` is supplied. The additive Supabase migration must be reviewed and applied using the project deployment gates first. Snapshots are readable only with backend privileges. A run is marked complete only after all expected segment/audience rows are read back. Partial ingestion remains failed/building and is not silently retried. This completion state concerns the registry only, not Meta matching or ad delivery.

## Label and campaign gates

The registry CLI uses the existing backend-only Vercel/Supabase secret-key aliases, with legacy service-role aliases as fallbacks. It never selects a public/anonymous key, and it rejects any other project URL. No environment variables or provider credentials are changed by these commands.

Reserve labels by evaluating the full audience inventory, including lookalikes, and every rule/adset dependency. Existing live rules using the old label are affected even when a particular audience was not explicitly selected as a suggestion. `getLabelMigrationBlockers` identifies occupied labels, live rule dependencies and missing source receipts. No tool here performs relabeling or deletes old audiences.

The four-criteria package is a versioned request candidate: OTHER_1 AND age 55–64 AND verified Nordland/Troms IDs AND FB_FEED. The first rule is +20% total; the next is +10% total for OTHER_1. Multiple criteria values mean OR; distinct criteria mean AND; first match wins. No stacking. Actual four-criteria creation/readback is required before treating the package as provider-verified. Rules with more than two criteria are API-editable only.

`buildValueRuleAttachment(null)` emits **only** `value_rules_applied:false`. Supplying an ID alongside false can attach that set; the helper prevents this mistake. Existing rule sets must be freshly checked for all attachments and snapshotted before reuse. No current rule set is overwritten by this implementation.

## Upload transport

`uploadAudienceBatches` is a library primitive, not a scheduled job. It accepts already-normalized SHA-256 PHONE/EMAIL tuples only, an explicit permission evidence reference, reviewed audience/account IDs, and an explicit authorization flag. It performs ADD requests only; there is no automatic replacement or deletion. The caller must use a durable, private checkpoint writer with an exclusive per-audience lock and unique session ID before a production upload is allowed. No production caller is installed yet.

Batches contain at most 9,999 persons. Checkpoints bind the dataset, row order, schema, audience, account, permission reference and session. Persisting `inFlight` happens before each request. A network failure or ambiguous receipt leaves that marker intact; resumption is blocked until receipt reconciliation. Partial-invalid receipts also stop. Invalid-entry samples are discarded. `num_received`, completed processing, estimated audience size and actual delivery are separate evidence layers.

## Experiment and release

The experiment spec and 28-row measurement worksheet are **local review artifacts**, not Ads Manager drafts. The artifacts deliberately contain null dates/costs/IDs until prerequisites are verified. Both planned cells are paused. Planned lifetime limits are NOK21,000 per cell, NOK42,000 total, 14 days, 50/50, 95% confidence, no auto-extension. Runtime creation must bind the actual source creative, product set, exclusions and attribution settings; the user must approve previews before activation. Creation of a randomized Meta SPLIT_TEST study and readback of its cell allocation is mandatory. Ordinary overlapping adsets are not a substitute.

No economic threshold, future LTV, missing conversion, or missing cost is invented. Net contribution subtracts goods, fulfillment/shipping, payment and expected return costs from revenue excluding VAT. Relative A/B rule-package results do not establish absolute advertising incrementality.

## Verified documentation (2026-09-06)

- https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules
- https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding-and-optimization/bid-multiplier
- https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences
- https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search
- https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/split-testing
- https://shopify.dev/docs/api/admin-graphql/2026-07/queries/customers
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/local-development/cli-workflows
- https://zod.dev/v4

Twilio informs provenance and segment governance, not a new messaging channel. Evidence-Based Marketing preserves the approved hypotheses and the separation between attribution, observed value and causal effect. Its decision-brief tool is not exposed; no unsupported claim of automated evidence verification is made.
