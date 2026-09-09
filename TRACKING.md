# TRACKING.md

## TAGS og PIXLER utenfor kodebasen

- Aktiv: [GTM Web](src/lib/analytics/gtm/always-updated-web-gtm-version.json)
- Pauset rollback-artefakt, skal ikke publiseres sammen med app-loaderen:
  [GTM Signals Gateway Canonical v1](scripts/tracking/gtm/signals-gateway-canonical-v1.html)

Appen eier Meta `fbq(...)`-hendelsene, og den kanoniske CAPI-outboxen er eneste
servereier. Signals Gateway Pixel og manuelle `cbq('track')`- og
`cbq('trackCustom')`-kall er deaktivert så lenge direkte CAPI er aktiv.

## SIGNALS GATEWAY GCP

### Services:

1. .agent/signals/signals-hub.yaml
2. .agent/signals/signals-capig.yaml

**Custom domain:** signals.utekos.no via the Signals Gateway GCP load balancer

**Legacy Vercel switch:** `SIGNALS_GATEWAY_PIXEL_ENABLED` beholdes som `false`
i rollback-vinduet, men leses ikke lenger av appen.

### GTM Servers:
1. .agent/gtm-servers/gtm-preview.yaml
**Custom domain:** None
3. .agent/gtm-servers/gtm-server.yaml
**Custom domain:** cloud.server.utekos.no


## Data Quality

**This has to be optimized at all times.**

### Landing-page signal coverage

The target is to minimize implementation loss for eligible events, including
late marketing consent without a refresh. Purchase optimization does not make
upstream funnel observations irrelevant. A low reported LPV rate alone does not
establish a page-load failure or a specific auction penalty.

Keep these evidence stages separate in monitoring:

| Stage | Evidence and limit |
| --- | --- |
| Click arrival | Correlated production edge request; filter automation and repeated requests. It is not a unique Meta click. |
| Successful page/app render | Requires browser render evidence. HTTP 200 and the root PageView observer alone do not prove the destination content finished rendering. Mark this unknown where evidence is absent. |
| Internal PageView occurrence | Check both provisional captures and the canonical ledger, deduplicated by event identity. Provisional captures have bounded retention and are not Meta delivery. |
| Consent eligibility | Distinguish pending, explicit denial, analytics-only, and marketing grant. A missing observation is not an explicit denial. |
| Meta dispatch | Inspect the Meta outbox attempt and its own `consent_basis`. A later grant may differ from the immutable ledger's initial consent. |
| Meta receipt | `accepted_unverified` means API acceptance, not verified attribution or an Ads Manager LPV. |
| Meta-reported LPV | Use the explicit Insights action, campaign/ad scope, account timezone and reporting window. Missing/null is not zero. |
| Downstream conversion | Correlate ViewContent, AddToCart, Checkout and Purchase only using deterministic identities and eligible processing. Orders in the same time window are not automatically Meta-attributed. |

Use the same denominator when comparing LPV/link clicks and LPV/outbound clicks;
these are different rates. Consent-related exclusions, unknown render state,
collector failures and provider failures must be reported separately.

For an analytics-only PageView followed by a marketing grant on the current
page, reuse the original `event_id`, `page_view_id`, `event_time` and URL. The
collector may accept the same observation again to add its missing Meta attempt.
Keep the initial ledger row and consent unchanged; the new attempt records the
later grant. The existing provider/idempotency key prevents another Meta send.
Do not replay older analytics-only SPA pages or other providers during this
release. Browser and server use the same canonical identity for deduplication.

This contract does not authorize additional pre-consent collection or forwarding
denied events. Deployment readiness and live LPV impact require separate evidence.

### Shopify order snapshots and unresolved consent

The local 2026-09-03 release candidate restores continuous updates to the
existing `commerce.shopify_order_snapshots` table through the protected
`/api/cron/shopify-order-snapshots` route every 15 minutes. The sync resumes
from `max(updated_at_shopify)` with a 30-minute overlap and performs only
idempotent snapshot upserts; it does not accept canonical events or replay
Purchase/refund events. Direct email, phone, client IP, and private
order-status URLs are excluded from its minimized raw payload.

Missing, empty, invalid-JSON, and structurally invalid `utekos_consent`
attributes are represented as separate unresolved states with consent
`unknown`, while an explicit Cookiebot denial remains `denied`. All unresolved
states remain fail-closed and are ineligible for provider dispatch without an
explicit `granted` value.

This is not production evidence until the release is deployed and the table is
read back. A separate read-only Shopify inspection of 23 paid orders from
2026-08-26 through 2026-09-02 found 15 explicit grants, eight explicit denials,
and zero unresolved attributes, correcting the earlier claim that those eight
specific denials could not be distinguished from technical loss.

Event match quality (EMQ) is a score (out of 10) that indicates how effective the customer information sent from the server may be at matching event instances to a Meta account. 
High quality event matching may improve ads attribution and performance. 

**Optimization:**
