# Utekos kanoniske event-gap

Statusdato: 2026-09-10.

Kartlegging av events som er definert men ikke fyrt, parametre
som finnes i Zod men ikke fylles ved kallsted, og annen feil
konfig på kanonisk lag. Dette er **ikke** provider-dispatch
(Meta/Google/Microsoft) — se
[utekos-event-delivery-parameter-matrix.md](./utekos-event-delivery-parameter-matrix.md).

Definisjoner og kallsteder:
[utekos-canonical-event-library.md](./utekos-canonical-event-library.md).

---

## 1. Definert, ikke fyrt

### Skjema + `/api/events/*`, ingen reporter eller UI

Disse har Zod, `handleCanonical*Request/Route`, normalizer og
Data Manager-adapter. Ingen `createCanonical*`-fabrikk i bruk
fra app, ingen `*Reporter.ts`, ingen collector-kall fra
komponent.

| event_name | API | Forventet `custom_data` som aldri populeres | Nærliggende UI |
| --- | --- | --- | --- |
| `search` | `/api/events/search` | `search_id`, `search_term`, valgfri `result_state` | `HeaderSearch.tsx` prefetcher; fyrer ikke |
| `view_search_results` | `/api/events/view-search-results` | `search_id`, `result_revision`, `search_term`, `result_count` | `SearchResults.tsx` uten reporter |
| `form_start` | `/api/events/form-start` | `form_id`, `form_name`, valgfri `field_category` | Nyhetsbrev/venteliste fyrer bare `generate_lead` |
| `form_submit` | `/api/events/form-submit` | `submission_id`, `form_id`, `form_name`, `result` | Samme skjemaer |
| `form_error` | `/api/events/form-error` | `attempt_id`, `form_id`, `error_category` | Samme skjemaer |
| `filter_apply` | `/api/events/filter-apply` | `interaction_id`, `result_revision`, `filter_name`, `filter_value`, `result_count` | Ingen filter-reporter |
| `sort_apply` | `/api/events/sort-apply` | `interaction_id`, `result_revision`, `sort_key`, `result_count` | Ingen sort-reporter |
| `video_progress` | `/api/events/video-progress` | `video_id`, `milestone`, `video_title`, duration/time/percent | `HytteSeasonVideo.tsx` uten reporter |
| `size_guide_view` | `/api/events/size-guide-view` | `guide_id`, `open_sequence` | Størrelsesguide fyrer `select_promotion` i stedet |

`scripts/generate-phase2-canonical-events.mjs` kan generere
reporter/transport for en del av disse. De genererte filene er
ikke sjekket inn.

### Katalog uten Zod og uten rute

| event_name | Livssyklus | Merknad |
| --- | --- | --- |
| `checkout_error` | `blocked_source` | `parseCanonicalEvent` avviser. Forutsetninger i katalog: `checkout_attempt_id`, trygg `error_category`. |
| `payment_error` | `blocked_source` | Samme mønster med `payment_attempt_id`. |

### Ingest uten produsent i butikkfront

| event_name | Rute | Merknad |
| --- | --- | --- |
| `meta_app_event` | `POST /api/meta/non-web-events` | Flagg `META_APP_EVENTS_ENABLED` av. Ingen app/POS-produsent. |
| `meta_offline_event` | samme | `META_OFFLINE_EVENTS_ENABLED` av. |

### Rute uten den konstruksjonsstien den ser ut til å eie

| Overflate | Faktisk konstruksjon |
| --- | --- |
| `POST /api/events/generate-lead` | Appen POSTer ikke. `recordAcceptedGenerateLead` bygger eventet i server action. Browser pusher bare dataLayer. |

### Feil event på nærliggende UI

| UI | Forventet kanonisk event | Hva som faktisk skjer |
| --- | --- | --- |
| `HeaderSearch` | `search` / `view_search_results` | Ingen kanonisk event |
| `ComfyrobeSizeGuideDialog`, landing size-guide, `ProductSizeGuideDialog` | `size_guide_view` | `select_promotion` (Comfyrobe/landing). `LANDING_PROMOTIONS.sizeGuide` er aldri kalt. |
| Nyhetsbrev og produktventeliste | `form_start` / `form_submit` / `form_error` i tillegg eller i stedet | Bare `generate_lead` |
| `HytteSeasonVideo.tsx` | `video_progress` | Ingen kanonisk event |

---

## 2. Mangelfull parameterbruk ved fire-site

Feltet finnes i Zod (påkrevd eller valgfritt). Kallstedet
utelater det, setter dummy, eller bruker en annen verdi enn
navnet tilsier.

| Event | Felt | Observasjon | Fil |
| --- | --- | --- | --- |
| `scroll_depth` | `custom_data.percent_scrolled` | Settes lik `threshold` (25/50/75/90), ikke faktisk scrollprosent | `src/components/analytics/ScrollDepthObserver.tsx` |
| Alle browser-reporters | `impression_id` | Envelope-felt; ingen reporter setter det | `*Reporter.ts`, `readBrowserReporterContext` |
| `page_view` | `custom_data` | Valgfritt, alltid tomt | `PageViewObserver.tsx` / `createCanonicalPageView` |
| `page_view` | `edge_request_id` | Valgfritt, ikke satt fra observer | `pageViewEvent.ts` |
| `add_to_cart` | reporter-input `cartUpdatedAt` | Brukes til `cart_mutation_id`. UI sender den aldri; fallback er `mutationTimestamp` | `addToCartReporter.ts`, `shopifyAddToCartCommerce.ts` |
| `view_promotion` | `custom_data.items` | Valgfritt commerce-array; aldri satt | `PromotionImpression.tsx`, sticky-CTA |
| `select_promotion` | `custom_data.items` | Valgfritt; aldri satt | `reportLandingSelectPromotion.ts`, Comfyrobe-helpers |
| `select_promotion` | `LANDING_PROMOTIONS.sizeGuide` | Definert nøkkel, aldri kalt | `reportLandingSelectPromotion.ts` |
| `view_item` / `select_item` / `add_to_wishlist` | quantity / `pageViewId` | Mapper defaulter quantity 1; `pageViewId` faller tilbake til session | reporters + mappers |
| `refund` | `page_url`, `user_data` | Ikke satt på webhook-sti | `shopifyRefundToCanonicalRefund.ts` |
| `hero_interact` | dekning | Bare forside-CTA `read_more_hero`. Andre heroer bruker `select_promotion` | `MotionContentView.tsx` |

Valgfrie envelope-felt som bevisst bare fylles når observert
(`click_id`, `browser_id`, `referrer_url`, `user_data`) telles
ikke som gap.

---

## 3. Annen feil konfig (kanonisk lag)

### Katalog vs implementasjon

- `web_vital` har skjema, reporter, `POST /api/events/web-vital`
  og `POST /api/e/wv`, men er **ikke** i `eventCatalog.ts` eller
  `canonicalEventSchema`. Lagres i `ops.web_vitals`.
- `checkout_error` og `payment_error` står i katalogen uten Zod.
- `metaBusinessMessagingEventSchema` og
  `mapMetaBusinessMessagingEventToServerEvent.ts` finnes.
  Ingest godtar bare `source_type: app | offline`. Ikke i
  katalogen.

### GTM / pixel mapper events som aldri fyrer fra appen

Kanonisk `search` er i trigger- og pixel-kart, men har ingen
app-produsent:

- `config/gtm/web-microsoft-uet-native.json` —
  `view_item_list|select_item|view_item|add_to_cart|begin_checkout|search|generate_lead`
- `src/lib/analytics/gtm/always-updated-web-gtm-version.json`
  (Signals Gateway HTML-kart) inkluderer `search` og
  `generate_lead`
- `public/analytics/meta-pixel-canonical-v1.js` mapper `search`
- `public/analytics/pinterest-tag-canonical-v1.js` mapper
  `search`

`generate_lead` fyrer via server action + dataLayer, ikke via
`/api/events/generate-lead`. Browser-kart som forutsetter
collector-form er derfor delvis misvisende.

Samme GTM HTML-kart mangler flere events som **faktisk** fyrer:
`view_promotion`, `select_promotion`, `variant_select`,
`web_vital`, og Shopify-eide `purchase` / `refund` /
`add_payment_info` / `add_shipping_info`.

### OpenAPI 0.1.0 vs runtime

[utekos-events-0.1.0-implementation-matrix.md](./utekos-events-0.1.0-implementation-matrix.md)
dekker browser-collectors under `/api/events/*`. Den utelater
`purchase`, `refund`, `add_payment_info`, `add_shipping_info`,
`web_vital`, Meta non-web, `page-view/capture` og `/api/e/*`.

### Reporter uten UI

Ingen av de 17 `src/lib/analytics/*Reporter.ts`-filene er
uimporert. Alle har minst ett kallsted.

---

## Kort fasit

Klar for firing (konstruktør + kallsted): `page_view`,
`scroll_depth`, `web_vital`, `view_item`, `view_item_list`,
`select_item`, `add_to_cart`, `remove_from_cart`, `view_cart`,
`begin_checkout`, `add_to_wishlist`, `variant_select`,
`view_promotion`, `select_promotion`, `hero_interact`,
`interact_with_accordion`, `open_quick_view`, `view_category`,
`generate_lead`, `purchase`, `refund`, `add_payment_info`,
`add_shipping_info`.

Kun definert: `search`, `view_search_results`, `form_start`,
`form_submit`, `form_error`, `filter_apply`, `sort_apply`,
`video_progress`, `size_guide_view`, `checkout_error`,
`payment_error`.

Denne filen dokumenterer gap. Den endrer ikke sporingskode.
