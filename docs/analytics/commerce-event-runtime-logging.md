# Commerce event runtime logging

Status: implemented on 2026-08-03. Verify the current production state
against the active Vercel deployment before relying on these log searches.

## Purpose

Make accepted `add_to_cart`, `begin_checkout`, and Klarna Express order
stages searchable in Vercel Runtime Logs without adding customer data,
Shopify cart identifiers, Klarna authorization tokens, or order identifiers
to operational logs.

The server log is evidence that the first-party collector accepted or
deduplicated an event. It is not proof that GTM, GA4, Meta, Microsoft, Shopify,
Klarna, or another provider received or attributed the event.

## Canonical flow

```text
Successful Shopify cart mutation
  -> canonical browser event and GTM dataLayer event
  -> consent-gated first-party collector
  -> accepted or duplicate result
  -> structured Vercel Runtime Log
```

Klarna Express adds two distinctions to this flow:

```text
Klarna Express click
  -> successful cartLinesAdd
  -> add_to_cart
  -> begin_checkout with checkoutMethod=klarna_express
  -> Klarna authorization
  -> /api/klarna/orders stages in Vercel Runtime Logs
```

For every accepted `begin_checkout`, the server also stores the validated
method as `payload.checkout_method` in `marketing.event_ledger`. The allowed
values are `shopify_checkout` and `klarna_express`. A missing or invalid
internal method header fails closed to `shopify_checkout`; the server value
overrides any client-supplied payload value.

## `add_to_cart` producers

All current producers converge on `reportCanonicalAddToCart` and
`/api/events/add-to-cart` after a successful cart mutation.

| Producer | Storefront surfaces |
| --- | --- |
| `useCanonicalAddToCart` | Product cards, gift-guide product cards, isbading Comfyrobe quick buy, NBCC product cards, empty-cart recommendations, cart upsells, and the original microfiber purchase section |
| `useAddToCartAction` | Comfyrobe purchase, product detail purchase island, quick-view modal, and product-overview help card |
| `usePurchaseLogic` | Original tailored-warmth purchase experience |
| `useLandingPurchaseLogic` | Tailored-warmth landing purchase experience |
| `prepareKlarnaExpressBeginCheckout` | Every shared Klarna Express placement listed below |

## `begin_checkout` producers

| Producer | Storefront surfaces | Logged checkout method |
| --- | --- | --- |
| `CheckoutButton` | Main cart checkout | `shopify_checkout` |
| `useAddToCartAction` | Direct "Gå til kassen" action on Comfyrobe, product detail, quick view, and help card | `shopify_checkout` |
| `usePurchaseLogic` | Original tailored-warmth checkout | `shopify_checkout` |
| `prepareKlarnaExpressBeginCheckout` | Shared Klarna Express placements | `klarna_express` |

## Klarna Express placements

`KlarnaProductExpressCheckout` is the shared implementation mounted in:

- general product cards;
- NBCC product cards;
- tailored-warmth landing and original microfiber experiences;
- the add-to-cart modal;
- the TechDown front-page campaign.

The shared flow writes `commerce.klarna_checkout` at these server stages:

- `order_request_received` after the request has passed JSON/schema parsing;
- `order_created` after Klarna confirms order creation;
- `order_creation_failed` when cart verification or Klarna order creation
  throws.

## Vercel Runtime Log searches

Search for the structured event name and then narrow by its data fields:

| What happened | Search term | Useful field |
| --- | --- | --- |
| Cart event accepted or deduplicated | `commerce.event` | `data.eventName=add_to_cart` |
| Checkout event accepted or deduplicated | `commerce.event` | `data.eventName=begin_checkout` |
| Shopify checkout | `commerce.event` | `data.checkoutMethod=shopify_checkout` |
| Klarna Express checkout | `commerce.event` | `data.checkoutMethod=klarna_express` |
| Klarna order request/result | `commerce.klarna_checkout` | `data.stage` |

Each canonical commerce line includes only:

- canonical event UUID;
- event name and accepted/duplicate status;
- currency, gross value, item-line count, and total quantity;
- sanitized page pathname without query parameters;
- fixed collector route, duration, runtime context, and optional Vercel
  request ID;
- checkout method for `begin_checkout`.

The runtime log and canonical ledger use the same server-validated method.
Runtime logs expose it as `data.checkoutMethod`; the ledger payload exposes it
as `checkout_method`.

## Purchase notifications

The authoritative Shopify `orders/paid` webhook sends one internal email
notification per canonical purchase. The canonical event UUID is the Resend
idempotency key, so Shopify retries do not create duplicate emails. A failed
notification returns HTTP 500 after the purchase has been durably accepted;
the next Shopify retry can therefore retry only the idempotent notification.

The email contains only currency, paid value, and item-line count. It excludes
customer details, Shopify order identifiers, transaction identifiers, and
line-item names. Successful and failed delivery attempts are searchable as
`commerce.purchase_notification_sent` and
`commerce.purchase_notification_failed`.

## Consent and evidence boundary

The browser still emits the Google `dataLayer` event according to the
existing Advanced Consent Mode contract. The first-party commerce collector
is called only when analytics or marketing consent is granted. Vercel will
therefore not receive a `commerce.event` line for a consent-denied browser
event. The implementation deliberately does not bypass that boundary.

Klarna order-stage logs are operational payment-flow logs. They contain no
authorization token, customer details, line items, cart ID, or order ID.

## CSP report for `kasse.utekos.no`

A line with `event=csp-report`, `directive=connect-src`,
`blockedHost=kasse.utekos.no`, and `disposition=report` means the current
report-only policy predicts that an enforced policy would block a background
connection to the checkout host. It does not mean the request was blocked.
Normal top-level navigation to checkout is not governed by `connect-src`.

The report currently stores no full blocked URL or initiator. Do not add the
host to `connect-src` until browser/network evidence identifies the legitimate
request that produced the report.
