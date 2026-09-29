# Shopify Customer Events pixels

These files are reviewed source artifacts for Shopify Admin
Customer Events. A repository or Vercel deployment does not
publish them to Shopify.

They are legacy/rollback artifacts for Purchase. The
desired-state Purchase browser source is the
`canonical-checkout-events` Shopify **App Web Pixel**, which is
distinct from Shopify Admin Customer Events / Custom Pixels. Do
not publish these files as a second Purchase owner. The
production cutover and Custom Pixel disconnection remain
externally unverified until a separately approved Shopify
activation and natural-order verification are complete.

## Meta Purchase

`meta-purchase-pixel.js` is the former Custom Pixel
implementation. It subscribes only to Shopify's documented
`checkout_completed` event and sends Meta Pixel event `Purchase`.
It:

- fails closed unless Shopify reports
  `marketingAllowed === true`;
- derives the same deterministic Purchase `event_id` as the
  canonical Shopify paid-order path so Pixel and Conversions API
  can deduplicate;
- sends the numeric Shopify variant IDs used by the Meta catalog,
  item quantities and prices, order value and currency;
- hashes a checkout email in the sandbox before using it for Meta
  advanced matching; and
- neither logs nor persists the email.

Shopify documents that `checkout_completed` can be absent if the
Thank you or first post-purchase page does not load. The
server-side paid-order path therefore remains the authoritative
and redundant Meta Purchase source.

Publishing or replacing this Shopify Custom Pixel would
reintroduce a second browser owner and is not part of the App Web
Pixel cutover. A natural, marketing-consented purchase must
instead prove the App Web Pixel v4 observation, canonical
paid-order match, Meta outbox attempt and provider result. Do not
create a real payment or order as a smoke test.

Official sources:

- [Meta Conversions API best practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices)
- [Meta event deduplication](https://www.facebook.com/business/help/823677331451951)
- [Shopify `checkout_completed`](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed)
- [Shopify Web Pixels privacy API](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy)

## Pinterest Checkout

`pinterest-checkout-pixel.js` subscribes only to Shopify's
documented `checkout_completed` event and sends Pinterest Tag
event `Checkout`. It:

- fails closed unless Shopify reports
  `marketingAllowed === true`;
- uses the numeric Shopify variant ID as Pinterest `product_id`;
- reads `product_brand` and `product_category` from the Shopify
  variant's product vendor and product type without fabricating
  missing values;
- sends value, currency, order ID, quantity and line-item prices;
- derives the same deterministic purchase `event_id` as the
  canonical order webhook so Pinterest Tag and Conversions API
  can deduplicate;
- hashes a checkout email in the sandbox before using it as the
  Pinterest Enhanced Match `em` value; and
- neither logs nor persists the email.

The storefront separately captures Pinterest's documented `_epik`
first-party cookie after marketing consent. The canonical
checkout attribution handoff carries it as `click_id.epik` to the
purchase webhook and Pinterest Conversions API. Click ID is
conditional: only visits attributable to a Pinterest click can
legitimately contain it.

Official sources:

- [Pinterest Tag](https://developers.pinterest.com/docs/track-conversions/pinterest-tag)
- [Pinterest Conversions API](https://developers.pinterest.com/docs/track-conversions/track-conversions-in-the-api)
- [Shopify `checkout_completed`](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_completed)
- [Shopify Web Pixels privacy API](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy)

## Activation gate

Pinterest Purchase delivery is inactive. The file remains
reviewable history only; publishing it is outside the
Meta-and-Google Purchase scope.

The required proof is:

1. exactly one browser `Checkout` from Pinterest Tag;
2. exactly one server `checkout` accepted by Pinterest
   Conversions API;
3. identical deterministic `event_id` values for browser/server
   deduplication;
4. matching order value, currency and numeric variant IDs;
5. product brand and category present when Shopify exposed them;
6. hashed email only, with no raw customer data in logs or
   payload inspection artifacts;
7. `click_id` present only when the natural journey originated
   from a Pinterest click; and
8. Pinterest Event Quality/dashboard evidence after provider
   processing, kept separate from browser and CAPI acceptance.

`ga4-commerce-pixel.js` is the former analytics-consented
GA4/sGTM Custom Pixel Purchase owner. It must not remain
connected after the App Web Pixel cutover is verified, or Google
can receive two browser-owned purchases.

## Snapchat Commerce

Snapchat Purchase delivery is inactive.
`snapchat-commerce-pixel.js` is a historical, marketing-consented
Shopify Customer Events pixel for `payment_info_submitted` and
`checkout_completed`. It initializes the shared Utekos SnapPixel
without browser PII or automatic page views, uses numeric Shopify
Product IDs, and sends the same ADD_BILLING/PURCHASE dedupe
values as the canonical CAPI v3 mapping.

The file is fail-closed through Shopify's privacy API. Its
presence in this repository does not publish or connect the
Custom Pixel, and it must not be connected as part of the
Meta-and-Google Purchase cutover.
