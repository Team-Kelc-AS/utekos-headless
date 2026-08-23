# Provider ownership

This file records the single-owner contract for paid-media telemetry. A
provider event may have a browser transport and a server transport, but it must
not have two competing implementations of either transport.

## Canonical owners

| Provider | Browser owner | Server owner |
| --- | --- | --- |
| Meta | `public/analytics/meta-pixel-canonical-v1.js` loaded by the app | canonical provider outbox adapter |
| Pinterest | `public/analytics/pinterest-tag-canonical-v1.js` loaded by the app | canonical provider outbox adapter |
| Snapchat | `public/analytics/snapchat-pixel-canonical-v1.js` loaded by the app | canonical provider outbox adapter |
| Google | web GTM with Consent Mode | server GTM / Google provider adapters according to the event catalog |
| Microsoft | web GTM UET | canonical provider outbox adapter |

The application captures canonical events and URL click IDs immediately in
memory. Paid-media browser bridges make no provider request until current
Cookiebot marketing consent is granted. Acceptance releases the original
canonical occurrence with the same event ID. Explicit rejection discards the
pending provider event and must never be replayed by a later preference change.

## Required GTM cutover

Read-only inspection on 2026-08-23 found two published duplicate owners that
must be paused as part of the production release:

1. Web container `GTM-5TWMJQFP`, live version 146, tag 153,
   `Meta – Pixel – Canonical browser parity`. The published HTML advances its
   data-layer cursor before a consent response and can override the app bridge
   through shared `__utekosMetaPixelState`.
2. Server container `GTM-M8GT97CV`, live version 31, tag 42,
   `Snap ConversionsAPI Tag`. It fires on all server events, has no consent gate,
   creates one-year Snapchat cookies, lowercases the full URL before extracting
   `ScCid`, and competes with the canonical Snapchat CAPI adapter.

Pause rather than delete these live tags so rollback remains explicit. Publish
each container change only in an isolated workspace with no unrelated pending
changes. The web default workspace had unrelated Cookiebot and Microsoft edits
at the time of inspection, so do not publish it as part of this cutover.

## Release proof

After the GTM cutover and application deployment, verify all of the following:

- no Meta, Pinterest or Snapchat provider request and no optional provider
  cookie before a visitor answers;
- acceptance on the first landing sends the original canonical event ID and
  retained click ID without requiring refresh;
- rejection sends nothing, and changing preferences later does not release
  events recorded under the rejected decision;
- one browser event and one canonical server event share the provider dedupe ID;
- new Snapchat CAPI HTTP 200 `VALID` responses are recorded as
  `accepted_unverified`, not dead-lettered;
- no historical Snapchat dead letter is replayed without a separately approved
  and dedupe-safe replay plan;
- a new Cookiebot scan references the deployed JavaScript chunks before its
  classifications are treated as current evidence.
