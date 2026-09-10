# Utekos kanoniske eventbibliotek

Statusdato: 2026-09-10.

Dette er fasit for kanoniske `event_name`-verdier og parametre i
Utekos-butikkfronten. Ikke bruk Mixpanel-/SaaS-navn som
`product_viewed`, `signup_completed` eller `checkout_started`.

Provider-levering (Meta, Google, Microsoft, Pinterest, Snapchat)
ligger i
[utekos-event-delivery-parameter-matrix.md](./utekos-event-delivery-parameter-matrix.md).
Ubrukte events og mangelfull parameterbruk ligger i
[utekos-canonical-event-gaps.md](./utekos-canonical-event-gaps.md).

## Kilder

| Lag | Fil | Innhold |
| --- | --- | --- |
| Katalog | `src/lib/analytics/eventCatalog.ts` | 35 navngitte events |
| Union | `src/lib/analytics/canonicalEvent.ts` | 33 Zod-skjemaer |
| Envelope | `src/lib/analytics/canonicalEventEnvelope.ts` | Delt ramme |
| Commerce | `src/lib/analytics/canonicalCommerceItem.ts` | `items[]` + verdi |
| Observerbarhet | `src/lib/observability/journey/contract.ts` | Ikke kanonisk commerce |

`web_vital` har Zod, reporter og rute, men er **ikke** i katalogen
eller `canonicalEventSchema`.

## Statusforklaring

| Status | Betydning |
| --- | --- |
| Klar | Skjema + konstruktør + kallsted som kan fyre |
| Kun definert | Skjema og `/api/events/*` finnes; ingen app-kallsted |
| Ingest | Rute tar imot payload; ingen butikkfront-produsent |
| Blokkert | Katalogoppføring uten Zod; `parseCanonicalEvent` avviser |

## Oversikt

| event_name | Livssyklus | Status | Zod `source` | Fire-sti |
| --- | --- | --- | --- | --- |
| `page_view` | active | Klar | `web` | `PageViewObserver` → `/api/events/page-view` |
| `view_item` | active | Klar | `web` | `viewItemReporter` → `/api/events/view-item` |
| `view_item_list` | active | Klar | `web` | `viewItemListReporter` → `/api/events/view-item-list` |
| `select_item` | active | Klar | `web` | `selectItemReporter` → `/api/events/select-item` |
| `add_to_cart` | active | Klar | `web` | `addToCartReporter` → `/api/events/add-to-cart` |
| `remove_from_cart` | active | Klar | `web` \| `webhook` | `CartLineItem` + carts/update-webhook |
| `view_cart` | active | Klar | `web` | `viewCartReporter` → `/api/events/view-cart` |
| `begin_checkout` | active | Klar | `web` | `beginCheckoutReporter` → `/api/events/begin-checkout` |
| `add_shipping_info` | active | Klar | `web` | Shopify checkout-pixel → `/api/shopify/checkout-observations` |
| `add_payment_info` | active | Klar | `web` | Shopify checkout-pixel → `/api/shopify/checkout-observations` |
| `purchase` | active | Klar | `webhook` \| `server` | orders/paid-webhook + reconciliation-cron |
| `refund` | active | Klar | `webhook` \| `server` | refunds/create-webhook + reconciliation-cron |
| `add_to_wishlist` | active | Klar | `web` | `addToWishlistReporter` → `/api/events/add-to-wishlist` |
| `variant_select` | active | Klar | `web` | `variantSelectReporter` → `/api/events/variant-select` |
| `view_promotion` | active | Klar | `web` | `viewPromotionReporter` → `/api/events/view-promotion` |
| `select_promotion` | active | Klar | `web` | `selectPromotionReporter` → `/api/events/select-promotion` |
| `hero_interact` | active | Klar | `web` | `heroInteractReporter` → `/api/events/hero-interact` |
| `interact_with_accordion` | active | Klar | `web` | `interactWithAccordionReporter` → `/api/events/interact-with-accordion` |
| `open_quick_view` | active | Klar | `web` | `openQuickViewReporter` → `/api/events/open-quick-view` |
| `view_category` | active | Klar | `web` | `viewCategoryReporter` → `/api/events/view-category` |
| `scroll_depth` | active | Klar | `web` | `ScrollDepthObserver` → `/api/events/scroll-depth` |
| `generate_lead` | active | Klar | `server` | `recordAcceptedGenerateLead` (ikke browser-reporter) |
| `search` | active | Kun definert | `web` | `/api/events/search` uten reporter |
| `view_search_results` | active | Kun definert | `web` | `/api/events/view-search-results` uten reporter |
| `form_start` | active | Kun definert | `web` | `/api/events/form-start` uten reporter |
| `form_submit` | active | Kun definert | `server` | `/api/events/form-submit` uten reporter |
| `form_error` | active | Kun definert | `web` | `/api/events/form-error` uten reporter |
| `filter_apply` | active | Kun definert | `web` | `/api/events/filter-apply` uten reporter |
| `sort_apply` | active | Kun definert | `web` | `/api/events/sort-apply` uten reporter |
| `size_guide_view` | active | Kun definert | `web` | `/api/events/size-guide-view` uten reporter |
| `video_progress` | active | Kun definert | `web` | `/api/events/video-progress` uten reporter |
| `checkout_error` | blocked_source | Blokkert | — | Ingen Zod, ingen rute |
| `payment_error` | blocked_source | Blokkert | — | Ingen Zod, ingen rute |
| `meta_app_event` | active | Ingest | `server` | `POST /api/meta/non-web-events` (flagg av) |
| `meta_offline_event` | active | Ingest | `server` | `POST /api/meta/non-web-events` (flagg av) |
| `web_vital` | utenfor katalog | Klar | `web` | `WebVitals` → `/api/events/web-vital` |

---

## Delt envelope

Alle implementerte events utvider `canonicalEventEnvelopeSchema`
med mindre annet er sagt.

**Påkrevd**

| Felt | Regel |
| --- | --- |
| `schema_version` | literal `1` |
| `event_name` | event-spesifikk literal |
| `event_id` | UUID |
| `event_time` | ISO datetime med offset |
| `source` | `web` \| `server` \| `webhook` (eventen innsnevrer) |
| `environment` | `development` \| `preview` \| `production` \| `test` |
| `consent` | se under |

**Valgfritt**

`experiment`, `user_data`, `click_id`, `external_id`, `browser_id`,
`client_ip_address`, `event_device_info`, `region_code`,
`impression_id`, `journey_id`, `page_url`, `previous_page_view_id`,
`location`, `signal_audit`.

Mange web-events gjør `page_url` / `page_title` / `page_view_id`
påkrevd i eget skjema.

### consent (Cookiebot)

Påkrevd: `analytics`, `marketing`, `preferences` (`denied` \|
`granted`), `source` literal `cookiebot`, `version`.

Purchase/refund kan i stedet bruke uavklart Shopify-attributt:
`analytics`/`marketing`/`preferences` literal `unknown`,
`source` literal `shopify_order_attribute`, `resolution`
(`missing` \| `empty` \| `invalid_json` \| `invalid_payload`).

### Nested valgfrie objekter

| Felt | Nøkler |
| --- | --- |
| `experiment` | påkrevd `key`, `variant` |
| `user_data` | `email_sha256[]`, `facebook_login_id`, `phone_sha256[]` |
| `click_id` | `dclid`, `epik`, `fbclid`, `gbraid`, `gclid`, `msclkid`, `sc_click_id`, `ttclid`, `twclid`, `wbraid` |
| `event_device_info` | `language`, `pixel_ratio`, `platform`, `screen_height`, `screen_width`, `user_agent`, `viewport_height`, `viewport_width` |
| `location` | `city`, `country_code`, `latitude`, `longitude`, `postal_code`, `region_code`, `source` |
| `signal_audit` | påkrevd per signal: `event_source_url`, `client_ip_address`, `client_user_agent`, `external_id`, `click_ids`, `meta_fbclid`, `meta_fbc`, `meta_fbp` |

Browser-reporters fyller typisk envelope via
`readBrowserReporterContext`: `environment`, `event_id`,
`event_time`, `page_url`, `page_title`, `page_view_id`,
`referrer_url`, `consent`, `browser_id` / `click_id` /
`external_id` når observert, `event_device_info`.
`impression_id` settes aldri av reporters.

---

## Commerce-verdi

De fleste handle-events bruker `canonicalCommerceValueSchema`:

**Påkrevd i `custom_data`:** `currency` (ISO 4217), `value`,
`gross_value`, `tax_value`, `items` (min 1).

**Hvert commerce-`items[]`-element, påkrevd:** `item_id`,
`product_id`, `variant_id`, `item_name`, `product_handle`,
`quantity`, `unit_price`, `gross_unit_price`, `tax_amount`,
`tax_rate`, `taxable`, `price_includes_tax`, `available_for_sale`,
`currently_not_in_stock`, `quantity_available`, `selected_options`
(`name`+`value`), `collection_ids`, `collection_titles`.

**Valgfritt på item:** `item_brand`, `item_variant`,
`item_category`–`item_category5`, `product_type`, `sku`, `gtin`,
`compare_at_unit_price`, `gross_compare_at_unit_price`, `discount`,
`gross_discount`.

Purchase og refund har **egne, slankere item-skjemaer**.

Under betyr «+ commerce-verdi» at `custom_data` inkluderer feltene
over, pluss event-spesifikke nøkler.

---

## Events

### `page_view`

- Skjema: `src/lib/analytics/pageViewEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd utover envelope:** `page_view_id`, `page_url`,
`page_title`.

**Valgfritt:** `edge_request_id`, `referrer_url`, `custom_data`
(uformatert `Record<string, unknown>`).

**Kallsted:** `src/components/analytics/PageViewObserver.tsx`,
montert i `src/app/layout.tsx`.
`createCanonicalPageView` → `sendGTMEvent` + collector
`POST /api/events/page-view`. Foreløpig fangst:
`POST /api/events/page-view/capture`.

---

### `view_item`

- Skjema: `src/lib/analytics/viewItemEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd:** `page_view_id`, `page_url`, `page_title`,
`custom_data` (= commerce-verdi).

**Valgfritt:** `referrer_url`.

**Kallsted:** `viewItemReporter.ts` via
`ProductViewItemReporter.tsx` (`/produkter/[handle]`),
`ComfyrobePurchaseClient.tsx`, `PurchaseClientLanding.tsx`,
`useMicrofiberLogic.ts`. UI sender `product` + `variant`; mapper
setter quantity 1.

---

### `view_item_list`

- Skjema: `src/lib/analytics/viewItemListEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd:** `page_url`, `page_title`, `page_view_id`,
`custom_data`: commerce-verdi + `impression_sequence`,
`item_list_id`, `item_list_name`, `total_item_count`
(≥ `items.length`), `items` min 1 max 20.

**Kallsted:** `viewItemListReporter.ts` via
`productListVisibilityTracker.ts` (50 % synlig i 1 s) og
`useCanonicalProductListVisibility` i `ProductCard.tsx`,
`HelpChooseCard.tsx`, `ProductGridCard.tsx`,
`NbccProductCardActions.tsx`, `EmptyCart/RecommendedItem.tsx`,
relaterte produkter / karuseller.

Observerte `item_list_id`: `product_card`,
`frontpage_featured_products`, `help_choose_carousel`,
`gaveguide_grid`, `nbcc_products`, `cart_recommended`,
`related_products`.

---

### `select_item`

- Skjema: `src/lib/analytics/selectItemEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd:** `page_url`, `page_title`, `custom_data`:
`interaction_id`, `item_list_id`, `currency`, `value`,
`gross_value`, `tax_value`, `items` (nøyaktig 1 commerce-item).

**Valgfritt:** `referrer_url`, `page_view_id`,
`custom_data.destination_url`.

**Kallsted:** `selectItemReporter.ts` via
`reportProductListSelectItem.ts` i `ProductCard.tsx`,
`HelpChooseCard.tsx`, `ProductGridCard.tsx`,
`EmptyCart/RecommendedItem.tsx`.

---

### `add_to_cart`

- Skjema: `src/lib/analytics/addToCartEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd:** `page_url`, `page_title`, `custom_data`:
commerce-verdi + `cart_mutation_id`, `cart_id`.

**Valgfritt:** `page_view_id`, `referrer_url`.

**Kallsted:** `addToCartReporter.ts` fra
`useAddToCartAction.ts`, `usePurchaseLogic.ts`,
`useCanonicalAddToCart.ts`, `useLandingPurchaseLogic..tsx`,
Klarna product express. UI sender `cartId`, `product`,
`quantity`, `variant`. `cartUpdatedAt` er reporter-input brukt
til `cart_mutation_id`; UI sender den ikke.

API: `POST /api/events/add-to-cart`.

---

### `remove_from_cart`

- Skjema: `src/lib/analytics/removeFromCartEvent.ts`
- Status: Klar
- Kilde: `web` \| `webhook`

**Påkrevd:** `custom_data`: commerce-verdi + `cart_mutation_id`,
`cart_id`.

**Valgfritt på skjema:** `page_url`, `referrer_url`, `page_title`,
`page_view_id`. SuperRefine: `source === 'web'` krever `page_url`
og `page_title`.

**Kallsted:**

- Browser: `removeFromCartReporter.ts` fra `CartLineItem.tsx`
  (slett og antall ned). Hoppes over uten `pageContext`.
- Webhook: `handleShopifyCartsUpdateRemoveFromCartWebhook.ts`
  (`source: webhook`, uten sidefelt).

API: `POST /api/events/remove-from-cart`,
`POST /api/shopify/webhooks/remove-from-cart`.

---

### `view_cart`

- Skjema: `src/lib/analytics/viewCartEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd:** `page_url`, `page_title`, `page_view_id`,
`custom_data`: commerce-verdi + `cart_id`, `view_sequence`.

**Kallsted:** `viewCartReporter.ts` fra `CartDrawer.tsx` når
skuffen er åpen og handlekurven har linjer.

---

### `begin_checkout`

- Skjema: `src/lib/analytics/beginCheckoutEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd:** `page_url`, `page_title`, `custom_data`:
commerce-verdi + `cart_id`, `checkout_id`, `creation_revision`.

**Valgfritt:** `checkout_method` (`shopify_checkout` \|
`klarna_express`), `page_view_id`, `referrer_url`.
`checkout_method` overskrives server-side fra
`X-Utekos-Checkout-Method`.

**Kallsted:** `beginCheckoutReporter.ts` fra `CheckoutButton.tsx`,
`useAddToCartAction.performGoToCheckout`,
`usePurchaseLogic.handleGoToCheckout`,
`KlarnaCartExpressCheckout.tsx`, Klarna product express.

API: `POST /api/events/begin-checkout`.

---

### `add_shipping_info`

- Skjema: `src/lib/analytics/addShippingInfoEvent.ts`
- Status: Klar (Shopify-pixel, ikke butikkfront-reporter)
- Kilde: `web`
- Eier: `shopify_app_web_pixel`

**Påkrevd:** `custom_data`: commerce-verdi + `checkout_id`,
`shipping_revision`, `begin_checkout_event_id`.

**Valgfritt:** `page_view_id`. Ingen påkrevd `page_url` /
`page_title`.

**Kallsted:** `POST /api/shopify/checkout-observations` ved
`checkout_shipping_info_submitted` →
`promoteShopifyAddShippingInfoObservation`. Krever aktivert
checkout-observasjon, cutover, matchende `begin_checkout` og
analysesamtykke.

---

### `add_payment_info`

- Skjema: `src/lib/analytics/addPaymentInfoEvent.ts`
- Status: Klar (Shopify-pixel, ikke butikkfront-reporter)
- Kilde: `web`

**Påkrevd:** `custom_data`: commerce-verdi + `checkout_id`,
`payment_revision`, `begin_checkout_event_id`.

**Valgfritt:** `page_view_id`.

**Kallsted:** samme observasjonsrute ved
`payment_info_submitted` →
`promoteShopifyAddPaymentInfoObservation`.

---

### `purchase`

- Skjema: `src/lib/analytics/purchaseEvent.ts`
- Status: Klar
- Kilde: `webhook` \| `server`

**Consent:** Cookiebot-snapshot **eller** uavklart
Shopify-attributt.

**Påkrevd `custom_data`:** `currency`, `value`, `transaction_id`,
`order_name`, `items` (min 1).

**Valgfritt `custom_data`:** `item_revenue`, `tax_value`,
`shipping_value`, `transaction_discount`, `coupon_codes`,
`customer_segmentation`.

**Item påkrevd:** `item_id`, `item_name`, `quantity`, `unit_price`.
**Item valgfritt:** `product_id`, `final_unit_price`, `discount`,
`sku`, `item_brand`, `item_category`.

**Valgfritt på event:** `page_view_id`, `begin_checkout_event_id`,
`journey_link_reason`, `referrer_url`.

**Kallsted:** `POST /api/shopify/webhooks/orders-paid`
(`shopifyOrderToCanonicalPurchase`, `source: webhook`);
`GET /api/cron/shopify-commerce-reconciliation`
(`shopifyGraphqlOrderToCanonicalPurchase`, `source: server`).

Ingen butikkfront-reporter. Shopify customer pixels kan fyre
provider-purchase med samme deterministiske `event_id` uten å
skrive ledger.

---

### `refund`

- Skjema: `src/lib/analytics/refundEvent.ts`
- Status: Klar
- Kilde: `webhook` \| `server`

**Påkrevd `custom_data`:** `currency`, `value`, `transaction_id`,
`refund_id`, `items` (kan være tom).

**Item påkrevd:** `item_id`, `item_name`, `quantity`, `unit_price`.
**Item valgfritt:** `sku`.

**Valgfritt på event:** `referrer_url`.

**Kallsted:** `POST /api/shopify/webhooks/refunds-create`; samme
reconciliation-cron.

---

### `add_to_wishlist`

- Skjema: `src/lib/analytics/addToWishlistEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd:** `page_url`, `page_title`, `custom_data`:
commerce-verdi + `wishlist_mutation_id`.

**Valgfritt:** `referrer_url`, `page_view_id`.

**Kallsted:** `addToWishlistReporter.ts` via
`persistAndReportAddToWishlist.ts` fra `WishlistButton.tsx`.
Fyrer ikke hvis varen allerede er i ønskelisten.

---

### `search`

- Skjema: `src/lib/analytics/searchEvent.ts`
- Status: Kun definert
- Kilde: `web`

**Påkrevd:** `page_url`, `page_title`, `custom_data`:
`search_id`, `search_term`.

**Valgfritt:** `referrer_url`, `page_view_id`,
`custom_data.result_state` (`results` \| `empty` \| `error`).

API: `POST /api/events/search`. Ingen `createCanonical*` /
reporter / UI.

---

### `view_search_results`

- Skjema: `src/lib/analytics/viewSearchResultsEvent.ts`
- Status: Kun definert
- Kilde: `web`

**Påkrevd `custom_data`:** `search_id`, `result_revision`,
`search_term`, `result_count`.

API: `POST /api/events/view-search-results`. Ingen kallsted.

---

### `view_promotion`

- Skjema: `src/lib/analytics/viewPromotionEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd:** `page_url`, `page_title`, `page_view_id`,
`custom_data`: `promotion_id`, `creative_name`,
`impression_sequence`.

**Valgfritt `custom_data`:** `promotion_name`, `creative_slot`,
`items`.

**Kallsted:** `viewPromotionReporter.ts` fra
`PromotionImpression.tsx`, `ComfyrobeStickyPurchase.tsx`,
`StickyMobileAction.tsx`. `items` settes ikke.
Alias: `POST /api/e/vp`.

---

### `select_promotion`

- Skjema: `src/lib/analytics/selectPromotionEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd `custom_data`:** `interaction_id`, `promotion_id`,
`creative_name`.

**Valgfritt `custom_data`:** `promotion_name`, `creative_slot`,
`items`.

**Kallsted:** `selectPromotionReporter.ts` fra
`reportLandingSelectPromotion.ts` (hero/empathy/sticky/frakt —
ikke nøkkelen `sizeGuide`), `ComfyrobeHeroActions.tsx`,
`reportComfyrobePurchaseSelection.ts`. `items` settes ikke.

---

### `generate_lead`

- Skjema: `src/lib/analytics/generateLeadEvent.ts`
- Status: Klar (server action, ikke browser-collector)
- Kilde: `server`

**Påkrevd:** `page_url`, `custom_data`: `submission_id`,
`form_id`. Ingen påkrevd `page_title`.

**Valgfritt:** `page_view_id`, `custom_data.lead_type`,
`currency`, `value`.

**Kallsted:** `createCanonicalGenerateLead` i
`recordAcceptedGenerateLead.ts` fra
`subscribeToNewsLetters.ts` og `submitProductWaitlist.ts`.
UI (`NewsLetterForm.tsx`, `NewsletterSignupDialog.tsx`,
`SoldOutWaitlistDialog.tsx`) pusher bare dataLayer via
`pushGenerateLeadToDataLayer`.

Observerte `form_id`: `newsletter_signup`,
`product_waitlist_utekos_dun`. `currency: 'NOK'`, `value: 0`.

`POST /api/events/generate-lead` finnes som ingest; appen POSTer
ikke dit.

---

### `form_start`

- Skjema: `src/lib/analytics/formStartEvent.ts`
- Status: Kun definert
- Kilde: `web`

**Påkrevd `custom_data`:** `form_id`, `form_name`.
**Valgfritt:** `field_category`. Krever `page_view_id`.

API: `POST /api/events/form-start`. Ingen kallsted.

---

### `form_submit`

- Skjema: `src/lib/analytics/formSubmitEvent.ts`
- Status: Kun definert
- Kilde: `server`

**Påkrevd `custom_data`:** `submission_id`, `form_id`,
`form_name`, `result` (`accepted` \| `rejected`).

**Valgfritt:** `page_url`, `page_view_id`. Ingen `page_title`.

API: `POST /api/events/form-submit`. Ingen kallsted.

---

### `form_error`

- Skjema: `src/lib/analytics/formErrorEvent.ts`
- Status: Kun definert
- Kilde: `web`

**Påkrevd `custom_data`:** `attempt_id`, `form_id`,
`error_category`.

API: `POST /api/events/form-error`. Ingen kallsted.

---

### `filter_apply`

- Skjema: `src/lib/analytics/filterApplyEvent.ts`
- Status: Kun definert
- Kilde: `web`

**Påkrevd `custom_data`:** `interaction_id`, `result_revision`,
`filter_name`, `filter_value`, `result_count`.

API: `POST /api/events/filter-apply`. Ingen kallsted.

---

### `sort_apply`

- Skjema: `src/lib/analytics/sortApplyEvent.ts`
- Status: Kun definert
- Kilde: `web`

**Påkrevd `custom_data`:** `interaction_id`, `result_revision`,
`sort_key`, `result_count`.

API: `POST /api/events/sort-apply`. Ingen kallsted.

---

### `variant_select`

- Skjema: `src/lib/analytics/variantSelectEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd `custom_data`:** `interaction_id`, `product_id`,
`variant_id`, `item_id`, `item_variant`, `availability`
(`available` \| `unavailable`).

**Kallsted:** `variantSelectReporter.ts` fra
`useVariantSelection.ts` (PDP), `useLocalVariantSelection.ts`
(quick view), `useLandingPurchaseLogic..tsx`,
`useMicrofiberLogic.ts`.

---

### `size_guide_view`

- Skjema: `src/lib/analytics/sizeGuideViewEvent.ts`
- Status: Kun definert
- Kilde: `web`

**Påkrevd `custom_data`:** `guide_id`, `open_sequence`.
Krever `page_view_id`.

API: `POST /api/events/size-guide-view`. UI for størrelsesguide
fyrer `select_promotion`, ikke dette eventet.

---

### `scroll_depth`

- Skjema: `src/lib/analytics/scrollDepthEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd `custom_data`:** `threshold` (`25` \| `50` \| `75` \|
`90`), `percent_scrolled` (1–100), `document_height`.
Krever `page_view_id`.

**Kallsted:** `scrollDepthReporter.ts` fra
`ScrollDepthObserver.tsx` i rot-layout.
`percent_scrolled` settes lik `threshold`.

---

### `view_category`

- Skjema: `src/lib/analytics/viewCategoryEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd `custom_data`:** `category_id`, `category_name`,
`view_sequence`. Krever `page_view_id`.

**Kallsted:** `viewCategoryReporter.ts` fra
`ViewCategoryObserver.tsx` på `/produkter`
(`produkter` / `Kolleksjonen`) og `/gaveguide`
(`gaveguide` / `Gaveguide`). `view_sequence: 1`.

---

### `hero_interact`

- Skjema: `src/lib/analytics/heroInteractEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd `custom_data`:** `cta_id`, `destination_path`,
`click_sequence`. Krever `page_view_id`.

**Kallsted:** `heroInteractReporter.ts` kun fra
`MotionContentView.tsx` (forside «Utforsk»):
`cta_id: 'read_more_hero'`,
`destination_path: '/skreddersy-varmen'`,
`click_sequence: 1`.

---

### `interact_with_accordion`

- Skjema: `src/lib/analytics/interactWithAccordionEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd `custom_data`:** commerce-verdi + `accordion_id`,
`accordion_title`, `interaction_sequence`, `interaction_type`
(literal `open`), `items` nøyaktig 1.

**Kallsted:** `interactWithAccordionReporter.ts` fra
`ProductAccordionInteractionReporter.tsx` på PDP
(`ProductPageAccordion.tsx`).

---

### `open_quick_view`

- Skjema: `src/lib/analytics/openQuickViewEvent.ts`
- Status: Klar
- Kilde: `web`

**Påkrevd `custom_data`:** commerce-verdi + `items` nøyaktig 1,
`open_sequence`, `source_surface`.

**Kallsted:** `openQuickViewReporter.ts` fra `QuickViewModal.tsx`
(`HyttePricingBuyButton.tsx`, `NewProductLaunchSection.tsx`).

---

### `video_progress`

- Skjema: `src/lib/analytics/videoProgressEvent.ts`
- Status: Kun definert
- Kilde: `web`

**Påkrevd `custom_data`:** `video_id`, `milestone`
(`10` \| `25` \| `50` \| `75` \| `90` \| `100`), `video_title`,
`video_duration`, `video_current_time`, `video_percent`.
Krever `page_view_id`.

API: `POST /api/events/video-progress`. Ingen reporter.
`HytteSeasonVideo.tsx` fyrer ikke dette.

---

### `checkout_error`

- Katalog: `eventCatalog.ts`
- Livssyklus: `blocked_source`
- Status: Blokkert
- Ingen Zod, ingen rute, `parseCanonicalEvent` avviser

Planlagte forutsetninger i katalog: godkjent kilde,
`checkout_attempt_id`, trygg `error_category`.

---

### `payment_error`

- Katalog: `eventCatalog.ts`
- Livssyklus: `blocked_source`
- Status: Blokkert
- Ingen Zod, ingen rute

Planlagte forutsetninger: godkjent kilde, `payment_attempt_id`,
trygg `error_category`.

---

### `meta_app_event`

- Skjema: `src/lib/analytics/metaNonWebCanonicalEvent.ts`
- Status: Ingest uten butikkfront-produsent
- Kilde: `server`

**Consent:** `marketing` literal `granted`, `source` literal
`app`.

**Påkrevd:** `meta_event` med `advertiser_tracking_enabled`,
`app_data` (`application_tracking_enabled`, `extinfo` nøyaktig
16-tuple), `event_id`, `event_name`, `event_time`, `user_data`.

Ved nestet `event_name === 'Purchase'` kreves
`custom_data.currency`, `order_id`, `value`, `content_ids`,
`contents`.

**Kallsted:** `POST /api/meta/non-web-events` (`source_type: app`),
gated av Bearer-secret og `META_APP_EVENTS_ENABLED`.

---

### `meta_offline_event`

- Skjema: samme fil
- Status: Ingest uten butikkfront-produsent
- Kilde: `server`

**Consent:** `source` literal `offline`, `marketing` granted.

**Påkrevd:** `meta_event` med `event_id`, `event_name`,
`event_time`, `user_data` (minst én kundematch-nøkkel).

**Kallsted:** samme ingest-rute (`source_type: offline`),
`META_OFFLINE_EVENTS_ENABLED`.

---

### `web_vital` (utenfor katalog og union)

- Skjema: `src/lib/analytics/webVitalEvent.ts`
- Status: Klar
- Kilde: `web`
- Lagring: `ops.web_vitals`, ikke canonical ledger-union

**Påkrevd:** `event_id`, `event_time`, `page_url`, `page_title`,
`page_view_id`, `custom_data`: `delta`, `entries`,
`ga_integer_value`, `metric_id`, `name` (`CLS` \| `INP` \| `LCP`
\| `FCP` \| `TTFB` \| `FID` \| `Next.js-hydration` \|
`Next.js-route-change-to-render` \| `Next.js-render`),
`pathname`, `value`.

**Valgfritt `custom_data`:** `attribution`, `navigation_type`,
`rating` (`good` \| `needs-improvement` \| `poor`).

**Kallsted:** `webVitalReporter.ts` fra `WebVitals.tsx` i
rot-layout (statistikk-samtykke). API:
`POST /api/events/web-vital`, alias `POST /api/e/wv`.
`VercelTelemetry.tsx` er Vercel Analytics, ikke dette eventet.

---

## Ikke kanonisk commerce

`JourneyObserver` sender observasjonsevents til
`/api/observability/journey` (`ops.journey_events`):

`utm_landing_page_view`, `page_arrival`, `section_view`,
`internal_link_click`, `journey_progress`.

Kontrakt: `src/lib/observability/journey/contract.ts`. Disse
inngår ikke i `eventCatalog.ts`.

`metaBusinessMessagingEventSchema` (WhatsApp / Messenger /
Instagram) kan mappes til Meta CAPI
`action_source: business_messaging`, men er ikke katalog-event
og ikke i ingest-ruten.
