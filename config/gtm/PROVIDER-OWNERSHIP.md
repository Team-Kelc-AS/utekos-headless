# Provider ownership

This file records the single-owner contract for paid-media telemetry and the
boundary between canonical first-party event capture and provider-specific
processing.

Canonical event creation, internal storage and provider dispatch are separate
operations.

Marketing consent controls whether consent-gated paid-media providers may
receive or process an event. It does not determine whether a lawful internal
commerce, operational or first-party measurement event may exist.

## Canonical owners

| Provider  | Browser owner                                                                                    | Server owner                                                         |
| -----------| --------------------------------------------------------------------------------------------------| ----------------------------------------------------------------------|
| Meta      | `MetaBrowserTransportLoader` and `public/analytics/meta-pixel-canonical-v1.js` loaded by the app | canonical provider outbox adapter                                    |
| Pinterest | `public/analytics/pinterest-tag-canonical-v1.js` loaded by the app                               | canonical provider outbox adapter                                    |
| Snapchat  | `public/analytics/snapchat-pixel-canonical-v1.js` loaded by the app                              | canonical provider outbox adapter                                    |
| Google    | web GTM with Consent Mode                                                                        | server GTM / Google provider adapters according to the event catalog |
| Microsoft | web GTM UET                                                                                      | canonical provider outbox adapter                                    |

No provider may have two competing implementations of the same browser or
server transport.

## Canonical capture and consent boundary

The application must create and retain canonical internal events whenever the
event is required for commerce, transaction processing, operational integrity,
reconciliation, security, or separately approved first-party measurement and a
valid non-consent legal basis exists for that processing.

Cookiebot marketing consent is a provider-routing decision. It must not be used
as a blanket instruction to suppress lawful internal business events.

Examples of canonical information that may continue to exist internally,
subject to the applicable retention and purpose rules, include:

- canonical event name, ID and occurrence time;
- product, variant, quantity and monetary values;
- cart, checkout and purchase state;
- order ID and transaction state;
- discounts, refunds and cancellations;
- customer/order relationship information required for commerce;
- internal margin, revenue and reconciliation data;
- internal operational and quality metadata.

This contract does not by itself establish a legal basis for first-party
measurement. Consent-independent measurement must be covered by the applicable
privacy documentation, purpose definition, retention policy and, where relied
upon, legitimate-interest assessment.

### Before marketing consent is granted

Before the applicable Cookiebot marketing consent has been granted:

- consent-gated paid-media browser transports must not send provider requests;
- consent-gated provider cookies or equivalent browser storage must not be
  created or read for paid-media purposes;
- a canonical internal event may still be created where its internal processing
  is independently lawful;
- a pending provider-routing candidate may reference the canonical event, but
  must not be treated as an already-authorized provider event;
- provider-specific identifiers must not be intentionally extracted, normalized,
  persisted, correlated or routed for advertising attribution unless their use
  is covered by an independently documented and approved rule.

Provider-specific identifiers include, without limitation, identifiers such as
`fbclid`, `fbc`, `fbp`, `msclkid`, `epik`, `scCid` and equivalent advertising
or click identifiers.

The fact that an identifier is available in a URL, HTTP request, first-party
endpoint or server environment does not by itself make its use
consent-independent.

Moving a consent-requiring tracking signal from browser processing to server
processing does not by itself change the consent requirement.

Infrastructure logging of incoming URLs and requests must not be treated as an
alternative attribution pipeline. Retention or redaction of known advertising
identifiers in infrastructure logs is governed separately by the logging and
privacy policy.

### Consent granted

When the applicable marketing consent is granted:

- the canonical browser owner may initialize the provider transport;
- eligible canonical events may be routed to the provider;
- provider-specific identifiers may be collected and used only from sources
  available after the consent decision and permitted by the applicable policy;
- the provider event must retain the canonical occurrence identity, including
  the canonical event ID where supported;
- browser and server copies of the same provider event must use the same
  deduplication identity where the provider supports redundant delivery.

An eligible canonical event that occurred while consent was unresolved may be
released after consent only when:

1. the canonical event was lawfully captured independently of marketing
   consent;
2. no consent-requiring provider tracking was performed before consent;
3. the granted consent covers the subsequent provider processing; and
4. the event has not previously been dispatched to that provider.

A page refresh must not be required merely to initialize an otherwise eligible
provider transport after consent.

If an advertising identifier is no longer available when consent is granted,
the application must not reconstruct it from data retained contrary to the
pre-consent rules.

### Consent rejected

Explicit rejection blocks provider dispatch. It does not delete or suppress an
otherwise lawful canonical internal event.

Events recorded under a rejected marketing-consent state must not later be
retroactively released to the provider solely because the visitor changes the
preference to accepted.

A later grant applies prospectively, except for events that were still in an
unresolved-consent state and satisfy the explicit release conditions above.

A provider payload must never be reconstructed from identifiers or tracking
data that should not have been retained during the rejected period.

### Consent withdrawn

Withdrawal stops new consent-gated provider processing prospectively.

Withdrawal does not rewrite historical canonical business records that Utekos
is independently entitled or required to retain, but those records must not be
used as an alternative route for new provider marketing processing.

## First-party measurement boundary

The internal measurement layer and the paid-media provider layer are separate.

Utekos may retain and analyse lawful first-party commerce and business data for
approved internal purposes even where paid-media provider dispatch is blocked.

This file must not be interpreted as authorizing:

- browser/device tracking without the required consent;
- persistent advertising identifiers without the required consent;
- provider click-ID collection merely because collection occurs server-side;
- third-party disclosure merely because the underlying order data is lawful to
  retain internally;
- retroactive construction of an advertising profile from consent-denied
  activity.

Any consent-independent attribution mechanism must have a separately documented
purpose, data inventory, legal basis, retention rule and technical boundary.

## Published GTM cutover

Readback on 2026-08-30 verified web container `GTM-5TWMJQFP` version 159,
`Meta transport cleanup – direct Pixel + canonical CAPI`.

The Signals Gateway browser bridge and the older GTM Meta Pixel
implementations are paused. They remain present only as explicit rollback
artifacts and must not be re-enabled while the app-owned Pixel and canonical
CAPI are active.

Version 159 was published at `2026-08-30T11:19:56Z`.

Cloud Run readback shows the sustained independent first-party `/events`
stream ending at that cutover; one later isolated POST is retained as an
anomaly for the next complete-window readback.

Subsequent production smokes observe only Meta's configured gateway mirror and
reject any new `signals.utekos.no` browser transport.

## Meta ownership

The resulting Meta ownership is:

1. Browser event owner:
   `public/analytics/meta-pixel-canonical-v1.js` only.

2. Gateway transport:
   Signals Gateway Pixel and all manual `cbq('track*')` bridges are disabled
   while direct canonical CAPI is active.

3. Server event owner:
   canonical `meta_conversions_api` outbox only.

4. Canonical Purchase:
   the internal canonical Purchase occurrence is the source of truth regardless
   of whether Meta is eligible to receive it.

5. Meta Purchase with marketing consent:
   when redundant browser/server delivery is enabled, exactly one browser
   Purchase from the canonical browser owner and exactly one canonical CAPI
   Purchase may be emitted for the same occurrence. Both must share the same
   provider deduplication identity.

6. Meta Purchase without marketing consent:
   no Meta Pixel Purchase and no Meta CAPI Purchase is dispatched. The internal
   canonical Purchase remains available for lawful Utekos commerce,
   reconciliation and approved first-party measurement purposes.

7. `opt_out=true`:
   Meta's `opt_out` parameter is a provider-processing instruction for an
   otherwise eligible event. It must not be used as a substitute for required
   consent or as a mechanism to bypass a rejected Cookiebot marketing decision.

Production smokes must fail if:

- the Signals Gateway SDK or an independent GTM `cbq` bridge is enabled while
  the canonical owners above are active;
- any manual `cbq('track*')` call is observed;
- any browser request reaches a known Signals Gateway/OpenBridge host contrary
  to the active ownership contract;
- a provider event is dispatched despite a blocking consent state;
- a provider-specific tracking identifier is persisted before the policy
  permits it.

## Release proof

After the GTM cutover and application deployment, verify all of the following:

- lawful canonical commerce and operational events continue to be recorded
  internally regardless of the visitor's marketing-consent decision;

- no consent-gated Meta, Pinterest or Snapchat provider request and no optional
  provider cookie is created before the applicable consent decision;

- no provider-specific click or browser identifier is intentionally persisted
  for advertising attribution before the applicable consent permits it;

- acceptance on the first landing can initialize the provider transport without
  requiring refresh;

- where an eligible pre-decision canonical occurrence is released after
  acceptance, it retains the original canonical event ID and occurrence time;

- a click identifier used after acceptance was obtained from a source legally
  available at or after the consent decision and was not reconstructed from
  prohibited pre-consent retention;

- rejection sends no consent-gated provider event while preserving the lawful
  canonical internal occurrence;

- changing a rejected preference to accepted does not replay events from the
  rejected period;

- for events configured for redundant Meta delivery, exactly one canonical
  browser event and one canonical server event share the provider deduplication
  ID;

- canonical Purchase, order value and other approved commerce facts remain
  observable internally when Meta routing is blocked;

- consent/routing telemetry provides sufficient evidence to determine why each
  provider dispatch was allowed, blocked or skipped without requiring provider
  identifiers to be retained in a denied state;

- the next complete Meta reporting window contains no unexplained server-event
  excess after the version 159 cutover; Meta's aggregated reporting is delayed
  and is not interchangeable with immediate transport HTTP status;

- new Snapchat CAPI HTTP 200 `VALID` responses are recorded as
  `accepted_unverified`, not dead-lettered;

- no historical Snapchat dead letter is replayed without a separately approved
  and dedupe-safe replay plan;

- a new Cookiebot scan references the deployed JavaScript chunks before its
  classifications are treated as current evidence.