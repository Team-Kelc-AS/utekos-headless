# EVENT_CATALOG v1

Statusdato: 2026-07-31

Dette er Utekos sin autoritative beslutnings- og revisjonsflate for
canonical events. Den maskinlesbare allowlisten ligger i
`src/lib/analytics/eventCatalog.ts`. GTM, sGTM og provideradaptere er
transportører; de eier aldri hendelsen og skal ikke introdusere hendelser
utenfor denne katalogen.

En oppføring med `planned` eller `blocked_source` er en beslutning, ikke en
påstand om at detector, schema, routing eller levering finnes i produksjon.

Gjeldende v1-inventar er **33 canonical events: 29 `active` og fire
`blocked_source`**. De fire blokkerte er `add_shipping_info`,
`add_payment_info`, `checkout_error` og `payment_error`.

## Ufravikelige runtime-regler

1. En canonical hendelse oppstår først når den dokumenterte postconditionen
   er sann. Klikk eller intensjon alene er ikke nok.
2. Retry av samme canonical forekomst beholder samme `event_id`.
3. Ledger bruker `event_name + event_id` som idempotency key. Providerlevering
   bruker `provider + event_name + event_id`, i samsvar med eksisterende
   databaseunikhet og uten å endre nøkkelen for allerede mottatte events.
4. Browser og server deler samme `event_id` når de representerer samme
   forekomst. For webhook-eide hendelser oppretter webhooken ID-en.
5. Provider-routeren kan bare opprette server-outbox-rader når mappingen har
   `serverOutbox: active`.
6. Aktive server-outbox-kombinasjoner styres av
   `serverOutbox: active` i katalogen og må matche
   `providerAdapterRegistry` + `providerOutboxWorkerRegistry`. Gjeldende
   register har 48 aktive provider/event-par: 28 Google, 17 Meta og tre
   Microsoft UET CAPI (`add_to_cart`, `begin_checkout`, `purchase`).
7. Events utenfor katalogen kan ikke skrives til canonical ledger eller
   eksporteres av canonical router.
8. Ledger og outbox er internt idempotente. Providertransport er
   at-least-once: et krasj etter ekstern aksept, men før lokal kvittering kan
   gi en ny nettverkslevering. Meta gjenbruker canonical `event_id`; Google
   skal bruke samme verdi som toppnivåfeltet `transactionId` og som browserens
   `transaction_id`. Google-deduplisering på tvers av kildene kan ikke regnes
   som produksjonsverifisert før den publiserte GTM/sGTM-ruten faktisk er
   observert med dette feltet.

## Status og retention

- `active`: canonical kilde og gjeldende produksjonsflyt finnes.
- `planned`: beslutningen er tatt, men hendelsen er ikke implementert.
- `blocked_source`: ingen godkjent autoritativ kilde finnes ennå.
- `serverOutbox: active`: routeren kan opprette retry-rad.
- `serverOutbox: disabled`: routeren skal aldri opprette retry-rad.
- `serverOutbox: blocked_no_worker`: mapping eller historiske rader finnes,
  men ingen godkjent worker kan levere dem. Nye rader og replay er blokkert.

Retentionverdiene gjelder kun minimale, ikke-PII dedupliseringsnøkler. De er
et teknisk forslag, ikke en juridisk konklusjon for eventpayloads,
samtykkesnapshots eller providerdata. Retention for disse flatene må besluttes
separat med privacy/legal før implementering.

| Kode | Teknisk retention |
| --- | --- |
| R30 | 30 dager, bare dedupe key |
| R90 | 90 dager, bare dedupe key |
| R25M | 25 måneder, bare dedupe key |
| R7Y | 7 år, bare dedupe key |

## Teknisk samtykkemodell

Dette er en teknisk samtykkemodell, ikke en juridisk konklusjon.
Ordrebehandling, lead-oppfølging og feildiagnostikk kan ha et separat
operativt formål, men dette gir ikke automatisk rett til analyse- eller
markedsføringseksport. Direkte kontaktfelt og fritekst er forbudt.
Hashverdier, eksterne ID-er, browser-/click-ID-er og request-IP kan bare
forekomme når en godkjent providermapping trenger dem og den dokumenterte
samtykkepolicyen tillater det.

| Profil | Browser/opprettelse | Førstepartsinnsamling og ledger | Analyseeksport | Markedsføringseksport | Operativt formål |
| --- | --- | --- | --- | --- | --- |
| C1 side | Lokal, ephemeral deteksjon tillatt | `analytics` eller `marketing` | `analytics`; Google cookieless følger Consent Mode | `marketing` | Ingen |
| C2 atferd | Lokal, ephemeral deteksjon tillatt | `analytics` eller `marketing` | `analytics`; Google cookieless følger Consent Mode | `marketing` | Ingen |
| C3 mutasjon | Først etter autoritativ respons | `analytics` eller `marketing` | `analytics`; Google cookieless følger Consent Mode | `marketing` | Commerce-mutasjonen er separat |
| C4 transaksjon | Autoritativ server/webhook | Minimal operativ ledger | Bare med `analytics` fra checkout-snapshot | Bare med `marketing` fra checkout-snapshot | Ordre/regnskap |
| C5 lead | Først etter autoritativ respons | `analytics` eller `marketing` | `analytics`; Google cookieless følger Consent Mode | `marketing` | Lead-oppfølging er separat |
| C6 feil | Først ved definitiv feil | `analytics` eller minimalt operativt | `analytics`; Google cookieless følger Consent Mode | Ingen | Feildiagnostikk |

## Canonical event-kontrakt

| Event                 | Lifecycle      | Eier og etterprøvbar trigger                                                       | Primær event-ID / når ny                                                                   | Samtykke | Retention |
| -----------------------| ----------------| ------------------------------------------------------------------------------------| --------------------------------------------------------------------------------------------| ----------| -----------|
| `page_view`           | active         | Next-router etter initial canonical view eller fullført navigasjon med endelig URL | `navigation_id`; ny ved neste fullførte navigasjon                                         | C1       | R30       |
| `view_item_list`      | active         | Produktliste når navngitt liste og løste items faktisk er synlige                  | `page_view_id + item_list_id + impression_sequence`; ny synlig sekvens                     | C2       | R30       |
| `view_category`       | active         | Kategori-/collectionflate når den faktisk er synlig                                | `page_view_id + category_id + view_sequence`; ny kvalifiserende visningssekvens            | C2       | R30       |
| `select_item`         | active         | Produktlenken når et akseptert valg starter navigasjon                             | `interaction_id`; ny akseptert interaksjon                                                 | C2       | R30       |
| `view_item`           | active         | Produktvisningen når produkt og valgt variant er løst og synlig                    | `page_view_id + product_id + variant_id + view_sequence`; ny visning eller variantkontekst | C2       | R30       |
| `add_to_wishlist`     | active         | Wishlist-store etter bekreftet persistens                                          | `wishlist_mutation_id`; ny vellykket mutasjon                                              | C3       | R90       |
| `add_to_cart`         | active         | Shopify cart-service etter akseptert mutasjon og oppdatert cart med linjen         | `cart_mutation_id`; ny vellykket Shopify-mutasjon                                          | C3       | R90       |
| `remove_from_cart`    | active         | Shopify cart-service etter akseptert fjerning og oppdatert cart                    | `cart_mutation_id`; ny vellykket fjerning                                                  | C3       | R90       |
| `view_cart`           | active         | Cart-side eller drawer når løst cart-innhold faktisk er synlig                     | `page_view_id + cart_id + view_sequence`; ny synlig sekvens                                | C2       | R30       |
| `begin_checkout`      | active         | Shopify checkout-service etter gyldig checkout-token eller URL                     | `checkout_id + creation_revision`; ny checkout                                             | C3       | R90       |
| `add_shipping_info`   | blocked_source | Shopify checkout-event etter bekreftet lagret fraktvalg                            | `checkout_id + shipping_revision`; ny lagret revisjon                                      | C3       | R90       |
| `add_payment_info`    | blocked_source | Shopify checkout-event etter bekreftet betalingssteg                               | `checkout_id + payment_revision`; ny akseptert revisjon                                    | C3       | R90       |
| `purchase`            | active         | Verifisert Shopify order-paid webhook etter relevant financial state               | `order_id + financial_state`; ny relevant state-overgang                                   | C4       | R7Y       |
| `refund`              | active         | Verifisert Shopify refund webhook etter opprettet refund                           | `refund_id`; ny Shopify-refund                                                             | C4       | R7Y       |
| `search`              | active         | Search-controller etter eksplisitt søk og løst resultat                            | `search_id`; nytt eksplisitt søk                                                           | C2       | R30       |
| `view_search_results` | active         | Search-results når løst resultatrevisjon faktisk er synlig                         | `search_id + result_revision`; ny synlig revisjon                                          | C2       | R30       |
| `view_promotion`      | active         | Promotion-observer ved minst 50 % synlighet i ett sammenhengende sekund            | `page_view_id + promotion_id + impression_sequence`; ny kvalifiserende sekvens             | C2       | R30       |
| `select_promotion`    | active         | Promotion-lenke når akseptert valg starter handling eller navigasjon               | `interaction_id`; ny akseptert interaksjon                                                 | C2       | R30       |
| `generate_lead`       | active         | Lead-service etter akseptert og lagret innsending (`marketing.leads` + event). Aktive produsenter: produktventeliste (`product_waitlist_utekos_dun`) og nyhetsbrev (`newsletter_signup`). | `submission_id` (= lead id); ny akseptert lead | C5       | R25M      |
| `form_start`          | active         | Form-controller ved første meningsfulle verdiendring, aldri fokus alene            | `form_id + page_view_id`; ny sidevisning                                                   | C2       | R30       |
| `form_submit`         | active         | Form-service etter serverakseptert innsending                                      | `submission_id`; ny akseptert innsending                                                   | C5       | R25M      |
| `form_error`          | active         | Form-service når definitiv validerings- eller serverfeil vises                     | `attempt_id`; nytt feilet forsøk                                                           | C6       | R90       |
| `filter_apply`        | active         | Produktfilter etter at oppdatert resultat er committet                             | `interaction_id + result_revision`; ny committet interaksjon                               | C2       | R30       |
| `sort_apply`          | active         | Produktsortering etter at sortert resultat er committet                            | `interaction_id + result_revision`; ny committet interaksjon                               | C2       | R30       |
| `variant_select`      | active         | Variant-controller etter at valgt variant er løst og committet                     | `interaction_id + variant_id`; nytt committet valg                                         | C2       | R30       |
| `size_guide_view`     | active         | Størrelsesguide når guideflaten faktisk er synlig                                  | `page_view_id + guide_id + open_sequence`; ny synlig åpning                                | C2       | R30       |
| `checkout_error`      | blocked_source | Godkjent autoritativ kilde ved definitiv checkout-feil                             | `checkout_attempt_id`; nytt feilet forsøk                                                  | C6       | R90       |
| `payment_error`       | blocked_source | Godkjent autoritativ kilde ved definitiv betalingsfeil                             | `payment_attempt_id`; nytt feilet forsøk                                                   | C6       | R90       |
| `scroll_depth`        | active         | Scroll-observer ved første passering av 25/50/75/90 % per sidevisning              | `page_view_id + threshold`; ny side eller terskel                                          | C2       | R30       |
| `hero_interact`       | active         | Forsidens hero-CTA når brukeren klikker «Se mer»                                   | `page_view_id + cta_id + click_sequence`; ny kvalifiserende CTA-interaksjon                 | C2       | R30       |
| `interact_with_accordion` | active    | PDP-detalj når brukeren åpner et tidligere lukket accordion etter produkt-/variantoppløsning | `page_view_id + product_id + variant_id + accordion_id + interaction_sequence`; ny lukket→åpen-interaksjon | C2 | R30 |
| `open_quick_view`     | active         | Quick-view når dialogen er åpen og produkt og valgt variant er løst                | `page_view_id + source_surface + product_id + variant_id + open_sequence`; ny vellykket åpning | C2    | R30       |
| `video_progress`      | active         | Video-controller ved første passering av 10/25/50/75/90/100 %                      | `page_view_id + video_id + milestone`; ny side, video eller milepæl                        | C2       | R30       |

`add_shipping_info` og `add_payment_info` forblir `blocked_source` til en
autoritativ Shopify Customer Events/Web Pixels-kilde er valgt.
`checkout_error` og `payment_error` forblir `blocked_source` til den
autoritative feilflaten er valgt og verifisert.

## Providerstøtte

Alle støttede eller planlagte provider-mappinger krever minst `event_id` og
`event_time` og har adapterversjon 1. De bruker `event_id` som
provider-dedupefelt, bortsett fra Google `view_item`, som bruker canonical
`event_id` som Googles toppnivåfelt `transactionId`/browserparameter
`transaction_id`. Eventspesifikke krav er eksplisitt angitt i
`eventCatalog.ts`.

### Aktiv produksjonssannhet 2026-07-31

| Event/provider | Support | Providernavn | Transport | Produksjon | Server-outbox |
| --- | --- | --- | --- | --- | --- |
| `page_view` / Supabase | supported | `page_view` | first-party API | active | disabled |
| `page_view` / Google | supported | `page_view` | GTM + sGTM | active | disabled |
| `page_view` / Meta | supported | `PageView` | Pixel + CAPI | active | **active** |
| `page_view` / Microsoft | supported | `page_view` | browser UET + UET CAPI | browser active, server blocked | `blocked_no_worker` |
| `page_view` / PostHog | planned | `page_view` | browser/server | not implemented | disabled |
| `view_item` / Supabase | supported | `view_item` | first-party API | active | disabled |
| `view_item` / Google | supported | `view_item` | GTM/sGTM + Data Manager | **active, ikke validate-only; felles dedupefelt er ikke live-verifisert** | **active** |
| `view_item` / Meta | supported | `ViewContent` | CAPI | active | **active** |
| `view_item` / Microsoft | supported | `view_item` | browser UET + UET CAPI | browser active, server blocked | `blocked_no_worker` |
| `view_item` / PostHog | planned | `view_item` | browser/server | not implemented | disabled |

Det finnes historiske pending `page_view`-rader fra før gjeldende
claimant-cutover. Historiske Meta-rader må fortsatt ikke replayes blindt, selv
om nye canonical `page_view` har en aktiv Meta-worker. Microsoft-radene mangler
fortsatt en godkjent serverworker og skal ikke replayes eller brukes som
grunnlag for nye serverrader før mapping og replay-policy er eksplisitt
godkjent.

### Historical — superseded providerplan fra 2026-07-17

Tabellen under beholdes som revisjonsspor for planstatusen 2026-07-17. Den er
ikke gjeldende runtimefasit; [event-matrisen](docs/analytics/event-matrix.md) og
den maskinlesbare katalogen eier nåværende providerstatus.

Tabellkodene er komplette statusprofiler:

- Supabase `P`: planned canonical first-party API, production `planned`,
  outbox `disabled`.
- Google `P(name)`: supported GTM/sGTM-mapping, production `planned`, outbox
  `disabled`.
- Meta `P(name)`: supported CAPI-mapping, production `planned`, outbox
  `disabled`; `—` er `not_relevant`.
- Microsoft `P(name)`: historisk planprofil. I gjeldende runtime er
  `add_to_cart`, `begin_checkout` og `purchase` aktive server-outbox-par;
  øvrige Microsoft-events er fortsatt uten godkjent serverworker. `—` er
  `not_relevant`.
- PostHog `P`: planned browser/server-mapping, production `not_implemented`,
  outbox `disabled`; `—` er `not_relevant`.

| Event | Supabase | Google | Meta | Microsoft | PostHog |
| --- | --- | --- | --- | --- | --- |
| `view_item_list` | P | P(`view_item_list`) | — | P(`view_item_list`) | P |
| `select_item` | P | P(`select_item`) | P/A(`SelectItem`) | P(`select_item`) MS-B | P |
| `add_to_wishlist` | P | P(`add_to_wishlist`) | P(`AddToWishlist`) | P(`add_to_wishlist`) | P |
| `add_to_cart` | P | P(`add_to_cart`) | P(`AddToCart`) | P(`add_to_cart`) | P |
| `remove_from_cart` | P | P(`remove_from_cart`) | — | P(`remove_from_cart`) | P |
| `view_cart` | P | P(`view_cart`) | — | P(`view_cart`) | P |
| `begin_checkout` | P | P(`begin_checkout`) | P(`InitiateCheckout`) | P(`begin_checkout`) | P |
| `add_shipping_info` | P | P(`add_shipping_info`) | — | P(`add_shipping_info`) | P |
| `add_payment_info` | P | P(`add_payment_info`) | P(`AddPaymentInfo`) | P(`add_payment_info`) | P |
| `purchase` | P | P(`purchase`) | P(`Purchase`) | P(`purchase`) | P |
| `refund` | P | P(`refund`) | — | — | — |
| `search` | P | P(`search`) | P(`Search`) | P(`search`) | P |
| `view_search_results` | P | P(`view_search_results`) | — | — | P |
| `view_promotion` | P | P(`view_promotion`) | — | — | P |
| `select_promotion` | P | P(`select_promotion`) | — | — | P |
| `generate_lead` | P | P(`generate_lead`) | P(`Lead`) | P(`generate_lead`) | P |
| `form_start` | P | P(`form_start`) | — | — | P |
| `form_submit` | P | P(`form_submit`) | — | — | P |
| `form_error` | P | P(`form_error`) | — | — | P |
| `filter_apply` | P | P(`filter_apply`) | — | — | P |
| `sort_apply` | P | P(`sort_apply`) | — | — | P |
| `variant_select` | P | P(`variant_select`) | — | — | P |
| `size_guide_view` | P | P(`size_guide_view`) | — | — | P |
| `checkout_error` | P | P(`checkout_error`) | — | — | P |
| `payment_error` | P | P(`payment_error`) | — | — | P |
| `scroll_depth` | P | P(`scroll_depth`) | — | — | P |
| `video_progress` | P | P(`video_progress`) | — | — | P |

## Beslutning for GA-automatikken

GA-avledede hendelser som beholdes er ikke canonical events og får ikke
skrives til canonical ledger. Når en canonical erstatning blir `active`, skal
den automatiske funksjonen deaktiveres før canonical eksport åpnes, slik at
samme interaksjon ikke dobbeltrapporteres.

| Automatisk GA-funksjon | Beslutning | Canonical erstatning |
| --- | --- | --- |
| Automatisk `page_view` | Deaktivert; canonical app-event eier | `page_view` |
| History pageviews | Deaktivert | `page_view` |
| Enhanced Measurement `scroll` | Behold midlertidig; deaktiver når canonical er aktiv | `scroll_depth` |
| Outbound `click` | Behold som GA-avledet, ikke-canonical | Ingen i v1 |
| Site search / `view_search_results` | Behold midlertidig; deaktiver når canonical er aktiv | `search` + `view_search_results` |
| Form interactions | Behold midlertidig; deaktiver når canonical er aktiv | `form_start` + `form_submit` |
| Video engagement | Behold midlertidig; deaktiver når canonical er aktiv | `video_progress` |
| `file_download` | Behold som GA-avledet, ikke-canonical | Ingen i v1 |
| `session_start` | Behold som GA-avledet systemevent, ikke-canonical | Ingen |
| `first_visit` | Behold som GA-avledet systemevent, ikke-canonical | Ingen |
| `user_engagement` | Behold som GA-avledet systemevent, ikke-canonical | Ingen |

Server-taggens brede «All GA4 Events»-regel må i en senere GTM/sGTM-endring
erstattes eller beskyttes av en eksplisitt allowlist. Denne katalogoppgaven
publiserer ikke GTM og endrer ikke produksjonscontainere. Inntil den
allowlisten finnes, må `view_item` ha samme `transaction_id` i browser- og
Data Manager-ruten; dette er Googles dokumenterte dedupliseringsnøkkel mellom
kildene. Lokal applikasjonskode forbereder begge feltene, men den publiserte
GTM-taggen er ikke bekreftet å videresende browserfeltet. Executed Data Manager
skal derfor behandles som en åpen release-risiko og stå validate-only dersom
denne nettverksverifikasjonen ikke kan gjennomføres.

## Offisielle kilder kontrollert

- [GA4 Enhanced Measurement events](https://support.google.com/analytics/answer/9216061)
- [GA4 automatically collected events](https://support.google.com/analytics/answer/9234069)
- [GA4 ecommerce measurement](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [Google Data Manager: send events, cross-source deduplication and regional IP exclusion](https://developers.google.com/data-manager/api/devguides/events/send-events)
- [Google Consent Mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Set up Consent Mode on websites](https://developers.google.com/tag-platform/security/guides/consent)
- [Meta Conversions API server-event parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event)
- [Microsoft Advertising UET Conversions API guide](https://learn.microsoft.com/en-us/advertising/guides/uet-conversion-api-integration?view=bingads-13)
- [Vercel Queue SDK](https://vercel.com/docs/queues/sdk)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

Provider-/consentkildene ble samlet kontrollert 2026-07-17; Vercel Queue- og
cronsemantikken ble kontrollert på nytt 2026-07-31. Kildene underbygger GA-navn,
Enhanced Measurement-triggerne, GA-avledede systemevents,
ecommerce-parametere, Consent Mode-adferd og Meta sin bruk av
`event_name` + `event_id` til deduplisering. Microsoft-kilden
underbygger custom `eventName`, `eventId`, `pageLoadId`, consent og
commercefelter. Utekos sine eierskaps-,
dedupe-, retention- og providerbeslutninger er prosjektkontrakter dokumentert
her og i den maskinlesbare katalogen.
