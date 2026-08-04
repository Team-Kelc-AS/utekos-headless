# Canonical event and destination matrix

**Current production:** verified 2026-07-31. Deployment
`dpl_7aYMhUMJTxyiTtWL38Wkxh5QpzaL` is `READY`, owns `utekos.no`, and runs
exact `main` SHA `7a9f19ed3f94cc08ee3140ddb4c99afe4af3d564`.

**Historical freeze:** the 2026-07-20 refresh at `ed16dfd06` / deployment
`dpl_3Pe1KmJSj5unFh1jD7VytiPvFr5H` is retained as audit history.

**Historical tracking release:** 2026-07-26. Web-GTM v135 is live; v133 introduced the
canonical mappings from isolated workspace 141, v134 removed the redundant
additional-consent setting, and v135 added future `dataLayer` polling to tag
153. Version 134 is the immediate GTM rollback.
Application deployment `dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` from
`3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2` is `READY`. Controlled genuine
events have correlated collector, ledger, queue, Google and Meta receipts.

The current code publishes only newly created provider-attempt primary keys
after database commit. Queue messages contain only `schema_version`, exact
`attempt_id`, and `adapter_key`; the consumer claims that exact ID together
with its provider/event pair. Provider-classified retry is stored as
`retry_scheduled` with `next_attempt_at`. Only thrown infrastructure failures
are eligible for Vercel Queue redelivery after 15 seconds. The five-minute
provider cron is recovery/fallback and due-retry processing, not primary
delivery. Vercel logs for the current deployment show the cron returning `200`
at five-minute intervals; no current-deployment queue callback appeared in the
inspected log window.

## How to read provider evidence

The destination columns describe intended/active mappings, not final delivery.
For every row, evaluate three separate axes using
[`provider-finality-runbook.md`](provider-finality-runbook.md):

- local attempt state in `ops.provider_dispatch_attempts`;
- provider delivery evidence from the embedded receipt and any authoritative
  reconciliation;
- external attribution/dedupe evidence at the provider's actual reporting
  grain.

Google ingest, Meta `events_received=1` and Microsoft HTTP 200 all start as
`accepted_unverified`. Only the existing Google request-status reconciliation
can promote an individual attempt to provider-confirmed `succeeded`.
Meta/Microsoft remain `accepted_unverified`; matching IDs, aggregate event
counts, EMQ, goal status or conversion reporting must be stated separately and
must never be inferred from this matrix.

Legend: `G` = Google Data Manager server outbox active; `M` =
Meta server outbox active; `MS-B` = Microsoft browser UET
catalogued/active; `MS-S` = Microsoft server UET CAPI worker
active; `MS-S blocked` = no server worker; `-` = not
relevant/disabled. All active browser events are persisted
through their matching `/api/events/<kebab-case>` route unless
the source column says webhook/server.

| Canonical event       | Lifecycle      | Owner / trigger                                                                      | Source / API                                                                 | Ledger/dataLayer/GA4                   | Google DM                             | Meta server              | Microsoft                             | Dedupe key                         | Consent                                                                          |
| --------------------- | -------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------- | ------------------------ | ------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| `page_view`           | active         | Next router; committed navigation                                                    | browser `/api/events/page-view`                                              | `page_view`                            | none; GTM/sGTM owns Google page view  | `PageView` M             | `page_view` MS-B; MS-S blocked        | navigation/page `event_id`         | analytics or marketing; provider-specific                                        |
| `view_item_list`      | active         | Product cards ≥50% visible continuously for 1s; unique variant/list once per page view; chunks ≤20 | browser `/api/events/view-item-list`                                         | `view_item_list`                       | `view_item_list` G                    | `ViewItemList` M         | `view_item_list` MS-B; MS-S blocked   | page/list/impression sequence      | analytics or marketing                                                           |
| `select_item`         | active         | Accepted product-list selection                                                      | browser `/api/events/select-item`                                            | `select_item`                          | `select_item` G                       | `SelectItem` M           | `select_item` MS-B; MS-S blocked      | interaction ID                     | analytics or marketing                                                           |
| `view_item`           | active         | Resolved visible product/variant                                                     | browser `/api/events/view-item`                                              | `view_item`                            | `view_item` G                         | `ViewContent` M          | `view_item` MS-B; MS-S blocked        | page/product/variant/view sequence | analytics or marketing                                                           |
| `add_to_wishlist`     | active         | Persisted wishlist mutation                                                          | browser/server `/api/events/add-to-wishlist`                                 | `add_to_wishlist`                      | `add_to_wishlist` G                   | `AddToWishlist` M        | `add_to_wishlist` MS-B; MS-S blocked  | mutation ID                        | post-mutation; provider-specific                                                 |
| `add_to_cart`         | active         | Successful Shopify cart mutation                                                     | browser/server `/api/events/add-to-cart`                                     | `add_to_cart`                          | `add_to_cart` G                       | `AddToCart` M            | `add_to_cart` MS-B; MS-S UET CAPI when msclkid | cart mutation ID                   | post-mutation; provider-specific                                                 |
| `remove_from_cart`    | active         | Successful Shopify cart response; full deletion, 1→0 and positive quantity decrease use actual returned delta | browser `/api/events/remove-from-cart`; webhook `carts/update` → `/api/shopify/webhooks/remove-from-cart` | `remove_from_cart`                     | `remove_from_cart` G                  | `RemoveFromCart` M       | `remove_from_cart` MS-B; MS-S blocked | cart mutation ID                   | post-mutation; provider-specific; Storefront response authoritative for browser change; Meta CAPI + Pixel dedupe via event_id |
| `view_cart`           | active         | Cart surface visible                                                                 | browser `/api/events/view-cart`                                              | `view_cart`                            | `view_cart` G                         | `ViewCart` M             | `view_cart` MS-B; MS-S blocked        | page/cart/view sequence            | analytics or marketing                                                           |
| `begin_checkout`      | active         | Authoritative checkout creation                                                      | browser/server `/api/events/begin-checkout`                                  | `begin_checkout`                       | `begin_checkout` G                    | `InitiateCheckout` M     | `begin_checkout` MS-B; MS-S UET CAPI when msclkid | checkout ID/revision               | post-mutation; provider-specific                                                 |
| `add_shipping_info`   | blocked_source | `checkout_shipping_info_submitted` proves rate choice, not a saved shipping revision | rejected Shopify Customer Events/Web Pixels candidate                        | declared only                          | disabled                              | -                        | disabled                              | checkout/shipping revision missing | not active                                                                       |
| `add_payment_info`    | active | Shopify `payment_info_submitted` proves submission only; v2 must correlate to consented canonical `begin_checkout` | Shopify App Web Pixel → `/api/shopify/checkout-observations` | canonical ledger; no browser dataLayer owner | Google Data Manager only | - | - | deterministic UUID from Shopify source event ID | analytics; Meta/Microsoft/PostHog disabled; not payment success |
| `purchase`            | active         | Shopify Admin Order payment notification; reconciliation is missed-delivery recovery | webhook `/api/shopify/webhooks/orders-paid`; Shopify Admin reconciliation    | `purchase`; no browser dataLayer owner | `purchase` G                          | `Purchase` M             | `purchase` MS-S active                | deterministic order legacy ID      | operational ledger; provider consent from checkout attribution                   |
| `refund`              | active         | Shopify Admin Refund create notification; reconciliation is missed-delivery recovery | webhook `/api/shopify/webhooks/refunds-create`; Shopify Admin reconciliation | `refund`; no browser dataLayer owner   | `refund` G; itemless omits `cartData` | -                        | -                                     | deterministic refund legacy ID     | operational ledger; provider consent/attribution from canonical Purchase linkage |
| `search`              | active         | Search controller                                                                    | browser/server `/api/events/search`                                          | `search`                               | `search` G                            | `Search` M               | `search` MS-B; MS-S blocked           | search ID                          | analytics or marketing                                                           |
| `view_search_results` | active         | Results revision visible                                                             | browser `/api/events/view-search-results`                                    | `view_search_results`                  | `view_search_results` G               | -                        | -                                     | search ID/result revision          | analytics or marketing                                                           |
| `view_promotion`      | active         | Promotion impression                                                                 | browser `/api/events/view-promotion`                                         | `view_promotion`                       | `view_promotion` G                    | -                        | -                                     | page/promotion/impression sequence | analytics or marketing                                                           |
| `select_promotion`    | active         | Promotion link selection                                                             | browser `/api/events/select-promotion`                                       | `select_promotion`                     | `select_promotion` G                  | -                        | -                                     | interaction ID                     | analytics or marketing                                                           |
| `generate_lead`       | active         | Successful lead service                                                              | server `/api/events/generate-lead`                                           | `generate_lead`                        | `generate_lead` G                     | `Lead` M                 | `generate_lead` MS-B; MS-S blocked    | submission ID                      | fulfilment plus provider consent                                                 |
| `form_start`          | active         | First form interaction                                                               | browser `/api/events/form-start`                                             | `form_start`                           | `form_start` G                        | -                        | -                                     | form/page                          | analytics or marketing                                                           |
| `form_submit`         | active         | Successful form service                                                              | server `/api/events/form-submit`                                             | `form_submit`                          | `form_submit` G                       | -                        | -                                     | submission ID                      | fulfilment plus provider consent                                                 |
| `form_error`          | active         | Failed form attempt                                                                  | browser/server `/api/events/form-error`                                      | `form_error`                           | `form_error` G                        | -                        | -                                     | attempt ID                         | analytics/operational; no marketing export                                       |
| `filter_apply`        | active         | Product-filter result revision                                                       | browser `/api/events/filter-apply`                                           | `filter_apply`                         | `filter_apply` G                      | -                        | -                                     | interaction/result revision        | analytics or marketing                                                           |
| `sort_apply`          | active         | Product-sort result revision                                                         | browser `/api/events/sort-apply`                                             | `sort_apply`                           | `sort_apply` G                        | -                        | -                                     | interaction/result revision        | analytics or marketing                                                           |
| `variant_select`      | active         | Variant selection                                                                    | browser `/api/events/variant-select`                                         | `variant_select`                       | `variant_select` G                    | -                        | -                                     | interaction/variant                | analytics or marketing                                                           |
| `size_guide_view`     | active         | Size-guide open                                                                      | browser `/api/events/size-guide-view`                                        | `size_guide_view`                      | `size_guide_view` G                   | -                        | -                                     | page/guide/open sequence           | analytics or marketing                                                           |
| `checkout_error`      | blocked_source | Missing authoritative checkout-error source                                          | none                                                                         | declared only                          | disabled                              | -                        | -                                     | checkout attempt                   | not active                                                                       |
| `payment_error`       | blocked_source | Missing authoritative payment-error source                                           | none                                                                         | declared only                          | disabled                              | -                        | -                                     | payment attempt                    | not active                                                                       |
| `scroll_depth`        | active         | Threshold observer                                                                   | browser `/api/events/scroll-depth`                                           | `scroll_depth`                         | `scroll_depth` G                      | `LandingScrollDepth` M    | -                                    | page/threshold                     | analytics or marketing                                                           |
| `view_category`       | active         | Category/collection surface visible (`/produkter`)                                   | browser `/api/events/view-category`                                          | `view_category`                        | `view_category` G                     | `ViewCategory` M         | -                                     | page/category/view sequence        | analytics or marketing                                                           |
| `hero_interact`       | active         | Homepage hero CTA click (`ReadMoreHeroClick` / Se mer)                               | browser `/api/events/hero-interact`                                          | `hero_interact`                        | `hero_interact` G                     | `HeroInteract` M         | -                                     | page/cta/click sequence            | analytics or marketing                                                           |
| `interact_with_accordion` | active    | User-triggered closed→open transition in PDP product details after product/variant resolution | browser `/api/events/interact-with-accordion`                                | `interact_with_accordion`              | `interact_with_accordion` G           | `InteractWithAccordion` M | `interact_with_accordion` MS-B; MS-S blocked | canonical interaction UUID | analytics or marketing                                                           |
| `open_quick_view`     | active         | Dialog confirmed open after product and selected variant are resolved; failed load emits nothing | browser `/api/events/open-quick-view`                                        | `open_quick_view`                      | `open_quick_view` G                   | `OpenQuickView` M        | `open_quick_view` MS-B; MS-S blocked  | canonical open UUID               | analytics or marketing                                                           |
| `video_progress`      | active         | Video milestone                                                                      | browser `/api/events/video-progress`                                         | `video_progress`                       | `video_progress` G                    | -                        | -                                     | page/video/milestone               | analytics or marketing                                                           |

## Destination IDs

| Destination                   | Current ID/status                        | Evidence grade                                   |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------ |
| Web GTM                       | `GTM-5TWMJQFP`                           | Verified live                                    |
| Server tagging URL            | `https://utekos.no/__sgtm`               | Verified live                                    |
| Exact server GTM container ID | `GTM-M8GT97CV` (`248521914`), version 29 | Verified GTM Admin                               |
| GA4                           | `G-FCES3L0M9M`                           | Verified in published web payload                |
| Google tag                    | `GT-MKRLF5WK`                            | Verified served through sGTM                     |
| Meta web pixel/dataset        | `1092362672918571`                       | Verified in published payload and current config |
| Microsoft UET                 | `97247724`                               | Verified in published payload                    |
| Supabase                      | `hkoawfbomhnzupcsdggb`                   | Verified live                                    |

Meta browser delivery is currently owned deterministically by the same-origin
`/analytics/meta-pixel-canonical-v1.js` bridge because production testing
proved that GTM's mapped Custom HTML tag did not execute. The bridge and GTM
template use the same mapping and shared `window.__utekosMetaPixelState.sent`
key, so later GTM execution cannot double-send a canonical name/UUID pair.
Direct application CAPI remains the only Meta server owner.

## Collector and reporter classification

- `createCanonicalCollectorTransport.ts`: required generic
  transport.
- Event-specific `*CollectorTransport.ts`: thin typed wrappers
  around endpoint/event name; keep until a later consolidation
  proves imports can be generated without harming clarity.
- Event-specific `*Reporter.ts`: necessary specialization for UI
  mapping plus dataLayer emission.
- `pageViewCollectorTransport.ts`,
  `viewItemCollectorTransport.ts`: specialized
  enrichment/idempotency behavior.
- `emitCanonicalPageView.ts`, `pushGenerateLeadToDataLayer.ts`:
  specialized dataLayer emitters.
- No file was proven unused solely from naming; no deletion is
  authorized by this freeze.

## Production warehouse snapshot — 2026-07-31T01:04:19Z

The catalog inventory is code-owned: **33 total / 30 active / three
`blocked_source`**. It must not be inferred from historical warehouse names.
Read-only `pink-lens` data contained 36 distinct historical/current ledger
spellings across 36,591 rows and 43,705 provider attempts. Attempt status was
31,722 `succeeded`, 10,187 `accepted_unverified`, 1,652
`skipped_unqualified`, and 144 historical `dead_lettered`; there were zero
`pending`, `processing`, `retry_scheduled`, and `failed` rows.

`ops.dead_letter_events` contained 1,281 historical audit rows, all resolved,
so the operational unresolved count was **0**. Historical `dead_lettered`
attempt rows and unresolved dead letters are different measures.

Microsoft UET CAPI has production acceptance history for all three active
workers: `add_to_cart` attempt
`6d35806a-fe96-474d-a8b3-a9057ddd2e48`, `begin_checkout` attempt
`8cf42314-450b-4441-b53c-9b19bba2462e`, and `purchase` attempt
`f8a584d8-359d-4584-923a-325a18a5ad52`. Each is `server_retry`,
`attempt_count=1`, and `accepted_unverified`. This proves provider API
acceptance, not final attribution. More recent unqualified rows correctly use
`skip_reason='missing_msclkid'`.

## Naming conflicts observed in production data

The 2026-07-31 live ledger has 36 distinct historical/current names.
Canonical snake_case coexists with provider/legacy names
including `PageView`, `ViewContent`, `AddToCart`,
`InitiateCheckout`, `Purchase`, `Lead`, `LandingScrollDepth`,
`LandingCTAClick`, `LandingSectionView`, `InteractWithAccordion`,
`HeroInteract` and `OpenQuickView`.

Current workers claim canonical event names, while provider
adapters map to provider names at dispatch. Historical PascalCase
rows such as `PageView` are not claimed by the current
`meta:page_view` worker. They must not be blindly
renamed/replayed without destination, event-ID and duplicate
analysis.
