# Provider ownership

This file records the single-owner contract for paid-media telemetry. A
provider event may have a browser transport and a server transport, but it must
not have two competing implementations of either transport.

## Canonical owners

| Provider | Browser owner | Server owner |
| --- | --- | --- |
| Meta | `MetaBrowserTransportLoader` and `public/analytics/meta-pixel-canonical-v1.js` loaded by the app | canonical provider outbox adapter |
| Pinterest | `public/analytics/pinterest-tag-canonical-v1.js` loaded by the app | canonical provider outbox adapter |
| Snapchat | `public/analytics/snapchat-pixel-canonical-v1.js` loaded by the app | canonical provider outbox adapter |
| Google | web GTM with Consent Mode | server GTM / Google provider adapters according to the event catalog |
| Microsoft | web GTM UET | canonical provider outbox adapter |

The application captures canonical events and URL click IDs immediately in
memory. Paid-media browser bridges make no provider request until current
Cookiebot marketing consent is granted. Acceptance releases the original
canonical occurrence with the same event ID. Explicit rejection discards the
pending provider event and must never be replayed by a later preference change.

## Published GTM cutover

Readback on 2026-08-30 verified web container `GTM-5TWMJQFP` version 159,
`Meta transport cleanup – direct Pixel + canonical CAPI`. The Signals Gateway
browser bridge and the older GTM Meta Pixel implementations are paused. They
remain present only as explicit rollback artifacts and must not be re-enabled
while the app-owned Pixel and canonical CAPI are active.

Version 159 was published at `2026-08-30T11:19:56Z`. Cloud Run readback shows
the sustained independent first-party `/events` stream ending at that cutover;
one later isolated POST is retained as an anomaly for the next complete-window
readback. Subsequent production smokes observe only Meta's configured gateway
mirror and reject any new `signals.utekos.no` browser transport.

The resulting Meta ownership is:

1. Browser event owner: `public/analytics/meta-pixel-canonical-v1.js` only.
2. Gateway transport: Signals Gateway Pixel and all manual `cbq('track*')`
   bridges are disabled while direct CAPI is active.
3. Server: canonical `meta_conversions_api` outbox only.
4. Purchase: canonical server outbox only; no app/browser Purchase source.

Production smokes must fail if the Signals Gateway SDK or independent GTM
`cbq` bridge is enabled, if any manual `cbq('track*')` call is observed, or if
any browser request reaches a known Signals Gateway/OpenBridge host.

## Release proof

After the GTM cutover and application deployment, verify all of the following:

- no Meta, Pinterest or Snapchat provider request and no optional provider
  cookie before a visitor answers;
- acceptance on the first landing sends the original canonical event ID and
  retained click ID without requiring refresh;
- rejection sends nothing, and changing preferences later does not release
  events recorded under the rejected decision;
- one browser event and one canonical server event share the provider dedupe ID;
- the next complete Meta reporting window contains no unexplained server-event
  excess after the version 159 cutover; Meta's aggregated reporting is delayed
  and is not interchangeable with immediate transport HTTP status;
- new Snapchat CAPI HTTP 200 `VALID` responses are recorded as
  `accepted_unverified`, not dead-lettered;
- no historical Snapchat dead letter is replayed without a separately approved
  and dedupe-safe replay plan;
- a new Cookiebot scan references the deployed JavaScript chunks before its
  classifications are treated as current evidence.
