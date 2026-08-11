# CE-2.3B — Shopify commerce reconciliation design

```text
Charter-version: 1.0.0
Roadmap: CE-2.3B
Affected invariants: INV-002, INV-003, INV-006, INV-008, INV-014,
  INV-018, INV-019, INV-021
Goal: freeze an exact implementable reconciliation contract and
  CE-2.3C file allowlist
Non-goals: runtime code, schema/env, vercel.json cron, production
  invocation, historical backfill, push/deploy, close
  STOP_ACTIVE_DOUBLE_COUNT_RISK
Primary role: canonical-event-plan-guardian
Supporting roles: evidence-auditor / database-auditor (read-only)
Conclusion: READY_FOR_CE_2_3C
```

## Governance snapshot

| Field                 | Value                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Expected parent       | `f9ac0638e70b3513d4d1b7ff44fb259fec8ab5b8`                                  |
| HEAD at design write  | `f9ac0638e70b3513d4d1b7ff44fb259fec8ab5b8`                                  |
| CE-2.3A-F1 status     | `ACCEPTED` / `REFUND_2026_04_COMPATIBILITY_FIXED`                           |
| Accepted runtime SHA  | `59c130c2ee9c93c3f62332fa03763d27e5168b05`                                  |
| Approach              | Dedicated reconciliation module (owner-approved)                            |
| Mutations by agent    | docs/evidence only                                                          |
| Allowed file          | `docs/analytics/evidence/ce-2.3b-shopify-commerce-reconciliation-design.md` |
| GraphQL validation    | Shopify Admin API `2026-04` via Dev MCP `validate_graphql_codeblocks`       |
| Conversation artifact | Shopify Dev MCP conversation `640b0aa8-ee12-46a8-927b-54f69294a1a2`         |

### Preflight

```text
Charter-version: 1.0.0
Roadmap task: CE-2.3B
Affected invariants: INV-002, INV-003, INV-006, INV-008, INV-014,
  INV-018, INV-019, INV-021
Goal: freeze GraphQL + lease + window + mapper + CE-2.3C allowlist
Non-goals: runtime, vercel.json, prod run, CE-2.3C implementation
Allowed files: this evidence file only
Start SHA / expected parent:
  f9ac0638e70b3513d4d1b7ff44fb259fec8ab5b8
Documentation status: CE-2.3A-F1 ACCEPTED; CE-2.3B authorized;
  STOP_REFUND_2026_04_PAYLOAD_INCOMPATIBLE CLOSED;
  STOP_ACTIVE_DOUBLE_COUNT_RISK still ACTIVE
```

Worktree note: unrelated local dirty/untracked files existed at
write time (same baseline as CE-2.3A-F1). This commit stages
**only** the allowlisted evidence file.

---

## Locked decisions (owner-approved)

| Topic                     | Decision                                                                 |
| ------------------------- | ------------------------------------------------------------------------ |
| Module shape              | Dedicated module under `src/lib/analytics/server/`                       |
| Mapper path               | Separate GraphQL DTO → GraphQL mappers → existing acceptors              |
| Canonical `source`        | `'server'` (no `reconciliation` enum value)                              |
| Identity                  | Same deterministic IDs as webhook                                        |
| Normal cadence            | 10 minutes (future `*/10 * * * *`, not in CE-2.3C)                       |
| Normal lookback           | 30 minutes                                                               |
| Initial / max auto window | 24 hours                                                                 |
| Historical gap            | `STOP_HISTORICAL_GAP_REQUIRES_CE_2_6`                                    |
| Lease job                 | `shopify_commerce_reconciliation`                                        |
| Lease duration            | 900 seconds                                                              |
| Watermark store           | `ops.integration_job_leases.metadata`                                    |
| GraphQL query             | One `orders` query: `updated_at` only                                    |
| Purchase guard            | Local `displayFinancialStatus === 'PAID'`                                |
| Page size                 | `50`                                                                     |
| Nested limits             | lineItems 250; refunds 250 (array); refundLineItems 250; transactions 50 |
| Cron in CE-2.3C           | Route + test only; **no** `vercel.json`                                  |
| Meta-backfill             | Do not extend or reuse                                                   |

---

## Architecture

```text
GET /api/cron/shopify-commerce-reconciliation
  → CRON_SECRET (hasValidCronAuthorization)
  → claimShopifyCommerceReconciliationLease
       (merge metadata; preserve watermark)
  → compute window from watermark / 24h initial
  → fetchShopifyCommerceReconciliationOrders (paginated)
  → per order:
       if displayFinancialStatus === 'PAID'
         → shopifyGraphqlOrderToCanonicalPurchase (source: server)
         → acceptCanonicalPurchase
       for each refund node:
         → shopifyGraphqlRefundToCanonicalRefund (source: server)
         → acceptCanonicalRefund
  → on full success: release + advance watermark (same DB update)
  → on any failure: release without watermark advance
  → PII-free ShopifyCommerceReconciliationSummary
  ⛔ no provider dispatch, no direct ledger/outbox insert
```

Provider delivery remains cron-owned by
`/api/cron/provider-outbox-dispatch` only.

---

## Identity contract

```text
Purchase:
  event_id      = deterministicPurchaseEventId(order legacy ID)
  transaction_id = shopifyPurchaseTransactionId(order legacy ID)

Refund:
  event_id       = deterministicRefundEventId(refund legacy ID)
  refund_id      = shopifyRefundRecordId(refund legacy ID)
  transaction_id = shopifyPurchaseTransactionId(order legacy ID)
```

Legacy IDs come from GraphQL `legacyResourceId` (string digits).
Webhook and reconciliation for the same Shopify object **must**
produce the identical `event_id`. Overlap → `accepted` then
`duplicate`.

Provenance is **not** encoded in canonical top-level fields. It
is visible via:

```text
job_name = shopify_commerce_reconciliation
PII-free summary (windowStart/windowEnd, counts, failure reasons)
structured logs without order names, emails, phones, IPs, URLs,
raw payloads, or provider data
```

---

## Window and watermark

Constants:

```text
NORMAL_LOOKBACK_MS = 30 * 60 * 1000
MAX_AUTOMATIC_LOOKBACK_MS = 24 * 60 * 60 * 1000
LEASE_SECONDS = 900
PAGE_SIZE = 50
```

Durable metadata keys (ISO-8601):

```text
lastSuccessfulWindowEnd
lastSuccessfulRunCompletedAt
```

Active-run metadata (merged on claim; no PII):

```text
activeRunStartedAt
activeWindowStart
activeWindowEnd
runMode
```

### Window computation

```text
runStartedAt = now (ISO)

if valid lastSuccessfulWindowEnd:
  windowEnd = runStartedAt
  windowStart = max(
    lastSuccessfulWindowEnd - 30 minutes,
    runStartedAt - 24 hours
  )
else:
  windowEnd = runStartedAt
  windowStart = runStartedAt - 24 hours
```

Automatic window never exceeds 24 hours.

If an operator-visible gap older than 24 hours is detected as
requiring recovery beyond the cap:

```text
STOP_HISTORICAL_GAP_REQUIRES_CE_2_6
```

Do not widen the search, scan full history, or start backfill.

### Watermark update rules

Update watermark **only** when all are true:

```text
- every orders page fetched through hasNextPage=false
- every page fully validated and processed
- no nested truncation / ambiguous refunds.length===250
- no GraphQL / mapping / acceptance failures
- every candidate ended accepted or duplicate
- watermark+release DB update confirmed
```

On any
partial/failure/`lease_blocked`/`invalid_reconciliation_watermark`:

```text
do not change lastSuccessfulWindowEnd
release lease in finally
next run repeats overlapping window (duplicates are safe)
```

Corrupt / future / unparseable watermark →
`invalid_reconciliation_watermark` (fail-closed; no silent 24h
fallback).

If event acceptance succeeds but watermark/release DB update
fails:

```text
run = failure
watermark = not advanced
```

---

## Lease contract

```text
job_name: shopify_commerce_reconciliation
duration: 900 seconds
table: ops.integration_job_leases
pattern: claim → run → release in finally
```

Reference implementation patterns (do not modify in CE-2.3C):

```text
src/lib/google/merchant-center/sync/claimMerchantCatalogSyncLease.ts
src/lib/google/merchant-center/sync/releaseMerchantCatalogSyncLease.ts
```

Reconciliation claim **must** differ from merchant claim by
**merging** metadata instead of replacing the whole JSON object,
so durable watermark fields survive acquire/reclaim.

Behaviors:

```text
active unexpired lease → status lease_blocked
  (no Shopify fetch, no accept, no watermark change)

postgres unavailable → postgres_unavailable

process crash without release → expires_at <= now()
  → next runner may reclaim

no heartbeat / lease renewal in v1
```

Manual and cron share the same job_name (no purchase-/refund-
specific locks).

---

## Exact GraphQL contract (Admin API 2026-04)

Client: `shopifyAdminGraphql` in
`src/lib/shopify/shopifyAdminGraphql.ts`
(`API_VERSION = '2026-04'`).

Auth env: `SHOPIFY_ADMIN_API_TOKEN`, `STORE_DOMAIN`.

Required scopes (from schema validation): at least `read_orders`
(and related read scopes returned by validator:
`read_marketplace_orders`, `read_customers`, `read_products` as
applicable to selected fields).

### Query string

```text
$query = `updated_at:>=${windowStartIso}`
```

No `financial_status:paid` in the shared query string.

### Variables

```ts
{
  first: 50,
  after: string | null,
  query: string // updated_at bound only
}
```

### Operation (validated)

```graphql
query ShopifyCommerceReconciliation(
  $first: Int!
  $after: String
  $query: String!
) {
  orders(
    first: $first
    after: $after
    sortKey: UPDATED_AT
    reverse: false
    query: $query
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      id
      legacyResourceId
      name
      createdAt
      processedAt
      updatedAt
      displayFinancialStatus
      currencyCode
      presentmentCurrencyCode
      taxesIncluded
      email
      phone
      clientIp
      statusPageUrl
      customAttributes {
        key
        value
      }
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
        presentmentMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
        presentmentMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        shopMoney {
          amount
          currencyCode
        }
        presentmentMoney {
          amount
          currencyCode
        }
      }
      discountCodes
      discountApplications(first: 50) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          allocationMethod
          targetType
          targetSelection
          ... on DiscountCodeApplication {
            code
          }
          ... on AutomaticDiscountApplication {
            title
          }
          ... on ManualDiscountApplication {
            title
          }
        }
      }
      shippingAddress {
        city
        provinceCode
        zip
        countryCodeV2
      }
      billingAddress {
        city
        provinceCode
        zip
        countryCodeV2
      }
      customer {
        id
        legacyResourceId
        defaultEmailAddress {
          emailAddress
        }
        defaultPhoneNumber {
          phoneNumber
        }
      }
      customerJourneySummary {
        firstVisit {
          landingPage
          referrerUrl
        }
      }
      lineItems(first: 250) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          name
          title
          quantity
          sku
          variant {
            id
            legacyResourceId
          }
          originalUnitPriceSet {
            shopMoney {
              amount
              currencyCode
            }
            presentmentMoney {
              amount
              currencyCode
            }
          }
          taxLines {
            rate
            priceSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
          }
          discountAllocations {
            allocatedAmountSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            discountApplication {
              allocationMethod
              targetType
            }
          }
        }
      }
      refunds(first: 250) {
        id
        legacyResourceId
        createdAt
        updatedAt
        totalRefundedSet {
          shopMoney {
            amount
            currencyCode
          }
          presentmentMoney {
            amount
            currencyCode
          }
        }
        refundLineItems(first: 250) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            quantity
            subtotalSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            lineItem {
              id
              name
              title
              sku
              variant {
                id
                legacyResourceId
              }
              originalUnitPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
        transactions(first: 50) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            amountSet {
              shopMoney {
                amount
                currencyCode
              }
              presentmentMoney {
                amount
                currencyCode
              }
            }
            status
            kind
            gateway
            createdAt
            order {
              legacyResourceId
            }
          }
        }
      }
    }
  }
}
```

Validation note: `Customer.email` / `Customer.phone` are
deprecated on 2026-04; design uses `defaultEmailAddress` /
`defaultPhoneNumber`. `Order.clientIp` is available.
`CustomerVisit.userAgent` is **not** available (validation
rejected). `OrderTransaction.legacyResourceId` is **not**
available (validation rejected).

`Order.refunds(first: Int)` returns `[Refund!]!` (not a cursor
connection) — confirmed by owner decision + schema accepting
`refunds(first: 250) { id ... }` without `pageInfo` on that
field.

Do **not** fetch `order.transactions` unless a later mapper proof
requires it (current webhook purchase/refund mappers do not).

---

## Purchase candidacy and mapping

### Candidacy

```text
order.displayFinancialStatus === 'PAID'
  → shopifyGraphqlOrderToCanonicalPurchase
  → acceptCanonicalPurchase

else
  → not a purchase candidate
```

`PARTIALLY_PAID`, `AUTHORIZED`, `PENDING`, `PARTIALLY_REFUNDED`,
`REFUNDED` are not purchase candidates unless the node still
reports exactly `PAID`.

### Field coverage vs webhook mapper

Webhook mapper:
`src/lib/analytics/server/shopifyOrderToCanonicalPurchase.ts` +
`mapShopifyOrderPurchasePricing.ts`.

| Need                   | GraphQL source                                                 | Notes                                                                             |
| ---------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Order legacy ID        | `legacyResourceId`                                             | Required for event_id                                                             |
| event_time             | `processedAt ?? createdAt`                                     | Same preference as webhook                                                        |
| currency               | `presentmentCurrencyCode \|\| currencyCode`                    | Uppercase ISO-4217                                                                |
| totals                 | `totalPriceSet` / `totalTaxSet` / `totalShippingPriceSet`      | MoneyBag → amount reader                                                          |
| taxesIncluded          | `taxesIncluded`                                                | Pricing parity                                                                    |
| line items             | `lineItems.nodes`                                              | variant legacy ID preferred as item_id                                            |
| discounts              | `discountAllocations` + `discountApplication.allocationMethod` | Prefer nested application over REST index                                         |
| coupon codes           | `discountCodes` + code applications                            | Cap 10, trim ≤100 chars                                                           |
| email/phone hashes     | order.email/phone + customer defaults                          | Hash via existing normalize/hash helpers                                          |
| attribution/consent    | `customAttributes`                                             | Map `{key,value}` → `{name,value}` then `parseOrderAttributionFromNoteAttributes` |
| page/referrer fallback | `customerJourneySummary.firstVisit` + `statusPageUrl`          | Only absolute http(s) URLs                                                        |
| client IP              | `clientIp`                                                     | Optional                                                                          |
| location               | shipping/billing address                                       | Only when marketing consent granted                                               |
| order_name             | `name`                                                         | Fail closed if missing                                                            |
| external_id            | attribution or `shopify_customer_${legacyResourceId}`          | Same rule as webhook                                                              |

### Unavailable / do not fabricate

| REST webhook field                | GraphQL                       | Handling                                           |
| --------------------------------- | ----------------------------- | -------------------------------------------------- |
| `contact_email`                   | no dedicated field            | Use `email` / customer default email only          |
| `client_details.user_agent`       | not on `CustomerVisit`        | Omit `event_device_info.user_agent`; do not invent |
| `landing_site` / `referring_site` | journey summary / status URL  | Optional fallbacks only; attribution attrs win     |
| `order_number`                    | use `name`                    | Do not invent sequential numbers                   |
| `financial_status` string         | `displayFinancialStatus` enum | Local `=== 'PAID'` guard                           |

GraphQL purchase mapper is a **new** function; do not convert
GraphQL into a fake `OrderPaid` REST payload. Shared helpers may
be extracted only when call-site analysis proves identical pure
logic (money rounding, tax exclusion, hashing libs already
shared).

---

## Refund candidacy and mapping

### Candidacy

```text
every refund in order.refunds
on every order returned by the updated_at window
  → independent of displayFinancialStatus
  → shopifyGraphqlRefundToCanonicalRefund
  → acceptCanonicalRefund
```

Re-seeing older refunds on an updated order is expected →
duplicate.

No refund watermark / local time filter in v1.

### Field coverage vs webhook mapper

Webhook: `shopifyRefundWebhookPayload.ts` +
`shopifyRefundToCanonicalRefund.ts`.

| Need             | GraphQL source                                                                   | Notes                             |
| ---------------- | -------------------------------------------------------------------------------- | --------------------------------- |
| Refund legacy ID | `legacyResourceId`                                                               | event_id                          |
| Order legacy ID  | parent order `legacyResourceId` or `transactions.nodes[].order.legacyResourceId` | Prefer parent order node          |
| event_time       | `createdAt`                                                                      | Preserve refund-created semantics |
| currency         | first transaction money currency                                                 | Fail closed if none               |
| value            | sum refundLineItems.subtotalSet, else sum transactions                           | Same preference as webhook        |
| items            | refundLineItems → lineItem variant/id, name/title, qty, unit price               |                                   |
| consent          | denied snapshot (same as webhook refund)                                         |                                   |

### Unavailable / do not fabricate

| Field                                     | Handling                                                  |
| ----------------------------------------- | --------------------------------------------------------- |
| REST `transactions[].currency` null cases | Prefer MoneyBag `currencyCode`; fail closed if unresolved |
| `OrderTransaction.legacyResourceId`       | Unavailable; not required for canonical IDs               |
| `processedAt` on Refund                   | Not required; use `createdAt`                             |

---

## Nested truncation rules

| Connection / field     | Limit | Truncation signal                    | Failure reason                          |
| ---------------------- | ----- | ------------------------------------ | --------------------------------------- |
| `lineItems`            | 250   | `pageInfo.hasNextPage === true`      | `order_line_items_truncated`            |
| `discountApplications` | 50    | `pageInfo.hasNextPage === true`      | `order_discount_applications_truncated` |
| `order.refunds`        | 250   | `refunds.length === 250` (ambiguous) | `order_refunds_truncation_ambiguous`    |
| `refundLineItems`      | 250   | `pageInfo.hasNextPage === true`      | `refund_line_items_truncated`           |
| `transactions`         | 50    | `pageInfo.hasNextPage === true`      | `refund_transactions_truncated`         |

On any of the above for a page:

```text
mapping_invalid for the resource
overall run = partial_page_failure
do not advance orders page cursor
do not mark window complete
do not update watermark
release lease in finally
```

Already accepted events on the failed page may duplicate on retry
— safe via deterministic IDs.

No nested cursor pagination in CE-2.3C v1.

---

## Pagination / page processing

```text
fetch page
→ validate GraphQL response (errors → shopify_graphql / user_error)
→ check nested truncation sentinels
→ process purchase + refund candidates
→ complete canonical acceptance for the page
→ only then advance orders cursor
```

Side failure → `partial_page_failure`; no silent page-size
reduction.

---

## Cron route contract (CE-2.3C)

```text
GET /api/cron/shopify-commerce-reconciliation
```

Mirror patterns from
`src/app/api/cron/provider-outbox-dispatch/route.ts` +
`src/lib/security/hasValidCronAuthorization.ts`:

```text
- Bearer CRON_SECRET fail-closed → 401
- Cache-Control: no-store
- dependency-injected runner for unit tests
- return PII-free summary JSON
- never call runRegisteredProviderOutboxBatch / provider adapters
- no auth bypass query params
- not registered in vercel.json in CE-2.3C
```

CE-2.3C does **not** authorize:

```text
production route call
initial 24h reconciliation
manual CRON_SECRET invocation
vercel.json schedule
push/deploy
```

Future activation (separate gate after CE-2.3C ACCEPTED +
deploy + proofs):

```json
{
  "path": "/api/cron/shopify-commerce-reconciliation",
  "schedule": "*/10 * * * *"
}
```

First 24h production run remains an explicit controlled action
before steady `*/10` enablement.

---

## Observability summary type

```ts
type ShopifyCommerceReconciliationSummary = {
  ok: boolean
  status:
    | 'completed'
    | 'lease_blocked'
    | 'partial_page_failure'
    | 'invalid_reconciliation_watermark'
    | 'runtime_timeout'
    | 'postgres_unavailable'
    | 'shopify_auth'
    | 'shopify_scope'
    | 'shopify_rate_limited'
    | 'shopify_graphql'
    | 'shopify_user_error'
    | 'mapping_invalid'
    | 'canonical_acceptance'
    | 'stop_historical_gap_requires_ce_2_6'
  windowStart: string
  windowEnd: string
  pages: number
  ordersExamined: number
  purchaseCandidates: number
  purchasesAccepted: number
  purchasesDuplicate: number
  refundCandidates: number
  refundsAccepted: number
  refundsDuplicate: number
  watermarkAdvanced: boolean
  failures: Array<{
    resourceType:
      | 'order'
      | 'refund'
      | 'page'
      | 'lease'
      | 'system'
    resourceIdHash: string
    reason: string
  }>
}
```

Hash resource IDs before logging. Never log order names, emails,
phones, IPs, URLs, raw payloads, or provider data.

---

## Failure semantics

| Reason                                | Behavior                                            |
| ------------------------------------- | --------------------------------------------------- |
| `lease_blocked`                       | No Shopify fetch; no watermark change               |
| `shopify_auth`                        | Fail closed; release                                |
| `shopify_scope`                       | Fail closed; release                                |
| `shopify_rate_limited`                | Fail closed; no cursor advance                      |
| `shopify_graphql`                     | Fail closed; no cursor advance                      |
| `shopify_user_error`                  | Fail closed; no cursor advance                      |
| `mapping_invalid`                     | Includes nested truncation reasons; page incomplete |
| `canonical_acceptance`                | Accept path threw / store failed                    |
| `postgres_unavailable`                | Lease/store unavailable                             |
| `partial_page_failure`                | Incomplete page; no watermark                       |
| `invalid_reconciliation_watermark`    | Corrupt durable metadata                            |
| `runtime_timeout`                     | Incomplete within budget; no watermark              |
| `STOP_HISTORICAL_GAP_REQUIRES_CE_2_6` | Gap beyond auto cap                                 |

Incomplete 24h initial run must fail visibly
(`partial_page_failure` and/or `runtime_timeout`) — never mark
complete, skip remaining pages, renew lease arbitrarily, or spawn
a parallel runner.

---

## Shared helper guidance (no forced refactor)

Reuse as-is (imported, not copied):

```text
deterministicPurchaseEventId / shopifyPurchaseTransactionId
deterministicRefundEventId / shopifyRefundRecordId
acceptCanonicalPurchase / acceptCanonicalRefund
postgresCanonicalEventStore
getVerifiedShopifyCustomerContext (or equivalent verified context)
parseOrderAttributionFromNoteAttributes (via key→name adapter)
hashCustomerMatchIdentifier + normalize email/phone
parseAbsoluteHttpUrl
resolveCanonicalEnvironment
shopifyAdminGraphql
hasValidCronAuthorization
```

Do **not** modify in CE-2.3C:

```text
shopifyOrderToCanonicalPurchase.ts
shopifyRefundToCanonicalRefund.ts
shopifyRefundWebhookPayload.ts
mapShopifyOrderPurchasePricing.ts
fetchOrdersForMetaBackfill.ts
vercel.json
```

Optional extract only if duplication is proven during
implementation: GraphQL MoneyBag amount reader; money rounding /
tax exclusion pure functions. Prefer GraphQL-specific pricing
mapper over forcing REST `OrderPaid` types.

---

## Final implementation allowlist (CE-2.3C)

Exact paths. No globs. No `vercel.json`. No webhook/backfill
files.

```text
src/lib/analytics/server/shopifyCommerceReconciliationTypes.ts
src/lib/analytics/server/shopifyCommerceReconciliationGraphqlSchema.ts
src/lib/analytics/server/fetchShopifyCommerceReconciliationOrders.ts
src/lib/analytics/server/fetchShopifyCommerceReconciliationOrders.test.ts
src/lib/analytics/server/shopifyGraphqlOrderToCanonicalPurchase.ts
src/lib/analytics/server/shopifyGraphqlOrderToCanonicalPurchase.test.ts
src/lib/analytics/server/shopifyGraphqlRefundToCanonicalRefund.ts
src/lib/analytics/server/shopifyGraphqlRefundToCanonicalRefund.test.ts
src/lib/analytics/server/mapShopifyGraphqlOrderPurchasePricing.ts
src/lib/analytics/server/mapShopifyGraphqlOrderPurchasePricing.test.ts
src/lib/analytics/server/runShopifyCommerceReconciliation.ts
src/lib/analytics/server/runShopifyCommerceReconciliation.test.ts
src/lib/analytics/server/claimShopifyCommerceReconciliationLease.ts
src/lib/analytics/server/claimShopifyCommerceReconciliationLease.test.ts
src/lib/analytics/server/releaseShopifyCommerceReconciliationLease.ts
src/lib/analytics/server/releaseShopifyCommerceReconciliationLease.test.ts
src/app/api/cron/shopify-commerce-reconciliation/route.ts
src/app/api/cron/shopify-commerce-reconciliation/route.test.ts
```

If CE-2.3C discovers a required pure helper extraction that
cannot live inside the files above without touching forbidden
webhook/backfill modules, stop and open a separate allowlist
amendment — do not silently expand scope.

---

## Forbidden (CE-2.3B and CE-2.3C)

```text
direct ledger / outbox inserts
direct provider dispatch / adapter calls
fake REST webhook payloads from GraphQL
new event ID algorithms
source: 'reconciliation'
schema migrations / new watermark tables
vercel.json schedule in CE-2.3C
historical backfill / Meta-backfill reuse
closing STOP_ACTIVE_DOUBLE_COUNT_RISK
production 24h invocation without separate approval
```

---

## Local inspection register

| Surface                 | Path                                                      | Result                                                               |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| Admin GraphQL client    | `src/lib/shopify/shopifyAdminGraphql.ts`                  | API `2026-04`; reuse                                                 |
| Purchase IDs            | `src/lib/analytics/purchaseEvent.ts`                      | Reuse deterministic helpers                                          |
| Refund IDs              | `src/lib/analytics/refundEvent.ts`                        | Reuse deterministic helpers                                          |
| Acceptors               | `acceptCanonicalPurchase.ts` / `acceptCanonicalRefund.ts` | Reuse                                                                |
| Webhook purchase mapper | `shopifyOrderToCanonicalPurchase.ts`                      | Do not modify; field map above                                       |
| Webhook refund mapper   | `shopifyRefundToCanonicalRefund.ts` + payload schema      | Do not modify                                                        |
| Pricing                 | `mapShopifyOrderPurchasePricing.ts`                       | REST-coupled; GraphQL twin allowed                                   |
| Lease pattern           | merchant claim/release                                    | Pattern only; merge metadata required                                |
| Cron auth               | `hasValidCronAuthorization.ts` + provider-outbox route    | Reuse                                                                |
| Meta backfill           | `fetchOrdersForMetaBackfill.ts`                           | Reference only; do not extend                                        |
| GraphQL schema          | Shopify Admin 2026-04 validate                            | Operation above VALID (with deprecated Customer email/phone avoided) |

---

## Design conclusion

```text
READY_FOR_CE_2_3C
```

### Blockers

```text
None that block CE-2.3C design acceptance.
STOP_ACTIVE_DOUBLE_COUNT_RISK remains ACTIVE (out of scope).
Production schedule / first 24h run remain separately gated.
```

### Next

1. Fresh verifier APPROVE on this evidence.
2. Owner ACCEPTED of CE-2.3B.
3. Only then start CE-2.3C at expected parent = this evidence
   commit’s full SHA (after acceptance registration if required
   by operating contract).
