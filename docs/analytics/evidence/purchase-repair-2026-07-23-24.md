# Evidence: Purchase repair for 2026-07-23 and 2026-07-24

**Date:** 2026-07-24
**Scope:** Shopify paid-order ownership, provider delivery,
historical replay containment, and future customer-match
enrichment

## Decision

- Do not replay any of the four paid orders from 2026-07-23 and
  2026-07-24. Preserve the canonical event ID, transaction ID,
  event time, value, currency, and consent snapshot.
- The three consented purchases already have terminal Google Data
  Manager success and Meta CAPI acceptance evidence. Provider
  acceptance and paid-ad attribution remain separate outcomes.
- The consent-denied purchase remains excluded from advertising
  providers.
- Microsoft remains `skipped_unqualified` without a real
  `msclkid`; no click ID is inferred or fabricated.
- Shopify `orders/paid` to canonical ledger to provider outbox
  remains the authoritative server-side Purchase path defined by
  ADR-0006.

## Local implementation

Future webhook and reconciliation purchases resolve a phone
number in this order:

1. order phone;
2. customer phone;
3. shipping-address phone;
4. billing-address phone.

The selected value is normalized and SHA-256 hashed through the
existing customer-match contract before the canonical event is
constructed. Raw phone numbers are not added to the canonical
schema, ledger, provider audit rows, or logs. No names or other
new personal-data fields are introduced.

The reconciliation Admin GraphQL query reads nullable `phone`
from both `shippingAddress` and `billingAddress`. Shopify's
current Admin GraphQL schema identifies both order address fields
as `MailingAddress`, where `phone` is a nullable `String`.

## Provider configuration interlock

### Before

- First-party paid-order webhook/outbox is the authoritative
  Purchase owner.
- An independent Shopify Facebook and Instagram data-sharing
  stream is the likely source of the additional Meta
  browser/server Purchase activity.
- An external Shopify customer-event or Google and YouTube source
  is the likely source of a GA4 Purchase with empty transaction
  ID and zero value.

### After this local change

- No Shopify Admin, sales-channel, customer-event, GTM, Meta,
  Google, Microsoft, catalog, feed, environment, database, or
  production setting has changed.
- Partner-source deactivation remains blocked until the operator
  explicitly approves the concrete provider mutation and the
  catalog/feed blast radius is confirmed.

### Approved future mutation and rollback

- Meta: disable only the Facebook and Instagram customer-data
  sharing or pixel measurement that independently emits Purchase.
  Keep the sales channel, catalog, and ad account connected. Roll
  back by restoring the captured prior data-sharing setting if
  canonical Purchase delivery regresses.
- Google: disable only the duplicate Purchase subscription or
  analytics destination. Keep Merchant Center feed/catalog
  connectivity. If Shopify does not expose a separate control,
  make no change. Roll back by restoring the captured prior
  destination setting.
- Capture screenshots or exported configuration immediately
  before and after either mutation. Do not publish GTM or deploy
  provider settings as part of an app release.

## Production acceptance gates

- One consented paid test order produces exactly one canonical
  ledger row and one authoritative provider attempt per qualified
  provider.
- Meta receives one authoritative server Purchase with correct
  value/currency; independent Shopify server Purchase is absent
  and deduplication is recorded.
- Google reports one transaction ID using item revenue excluding
  tax and shipping, with terminal Data Manager success and no
  parameterless duplicate.
- Microsoft sends only when the real journey contains `msclkid`;
  otherwise it records `skipped_unqualified`.
- A consent-denied test order produces no Meta, Microsoft, or
  Google marketing delivery.
- Recheck provider acceptance and Ads attribution separately
  after 24 and 48 hours.

## Verification status

- Targeted purchase/reconciliation/dispatch/replay tests: 37
  passed.
- Changed-file ESLint and `git diff --check`: passed.
- Shopify Admin GraphQL validation of the complete reconciliation
  query: passed.
- `pnpm exec next typegen`: passed.
- `pnpm build`: passed, including production compilation and
  route generation.
- Production `tracking:gateway:smoke`: passed against
  `https://utekos.no` with GTM and sGTM HTTP 200,
  `Cache-Control: no-store`, and no Vercel cache hit.
- Standalone `pnpm exec tsc --noEmit`: blocked by existing type
  errors in unrelated test files outside this change; the
  production build type check passed.
- `npm run mcp:build`: passed. `npm run mcp:doctor` remains
  blocked because the ignored local generated MCP configuration
  contains inline values for three pre-existing secret variables.
  No secret or MCP source configuration was changed as part of
  this repair.

Production deploy, controlled paid orders, provider-setting
changes, and the 24/48-hour observations require separate
approval and remain open.

## Dokumentasjonsstatus

Current Shopify Admin GraphQL schema, ADR-0006, deployment
controls, canonical mapping code, and provider evidence are
sufficient for this local change. They do not authorize
production deployment or provider configuration mutations.
