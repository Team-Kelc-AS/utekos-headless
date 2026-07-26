# FLOW - tracking, observability og kommersiell innsikt

Statusdato: 2026-07-26.

Dette dokumentet er den operative flytbeskrivelsen for hvordan
Utekos skal samle inn, lagre, levere og bruke analytics-,
tracking- og observasjonsdata. Dokumentet er bevisst delt i to:

1. Først beskrives den ønskede end-to-end-flyten slik den skal
   fungere når systemet utnyttes helt ut.
2. Deretter gjennomgås de samme trinnene på nytt med nåværende
   avvik, svakheter, aktive gap og lukkekriterier.

Målet er å gjøre det tydelig hvorfor data sendes til Supabase,
PostHog, annonseplattformer og observability-systemer, hva
dataene faktisk brukes til, hva som ikke er godt nok utnyttet
ennå, og hvilke feil som må lukkes før flyten kan regnes som
komplett.

Den kommersielle styringsplanen for hvordan dette løftes videre
med Supabase, BigQuery, PostHog, Vercel Workflows, MCP/agenter og
kundechatbot ligger i
[COMMERCIAL_INTELLIGENCE_PLAN.md](COMMERCIAL_INTELLIGENCE_PLAN.md).

## Kort fasit

### Meta-/provider-release 2026-07-26 — produksjonsverifisert

Releasen for de manglende og forsinkede canonical-eventene er aktiv i
produksjon. Web-GTM v134 er live; v133 introduserte mappingen fra isolert
workspace 141, mens v134 bare fjernet GTMs redundante additional-consent-krav.
Appdeployment `dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` fra eksakt SHA
`3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2` er `READY` og eier
`utekos.no`.

Releasen gjør følgende:

- aktiverer ekte `view_item_list` etter minst 50 % sammenhengende synlighet i
  ett sekund, én gang per variantgruppe og sidevisning, med maks 20 varer per
  event og sekvensbasert chunking;
- legger til komplette ende-til-ende-kontrakter for
  `interact_with_accordion` og `open_quick_view`;
- legger Meta CAPI til `view_item_list`, `view_cart`, `scroll_depth`,
  `view_category`, `hero_interact`, `interact_with_accordion` og
  `open_quick_view`, med identisk canonical UUID og Meta-navn i Pixel og CAPI;
- rapporterer `remove_from_cart` først etter godkjent Shopify-respons, også for
  en reell antallsreduksjon som 3 → 2;
- publiserer bare nyopprettede provider-attempt-ID-er etter databasecommit til
  Vercel Queue-topic `canonical-provider-dispatch-v1`. Consumeren claimer kun
  den eksakte primærnøkkelen; femminutterscronen forblir retry og fallback;
- kjører en 15-minutters helsejobb for manglende forsøk, køpubliseringsfeil,
  initial pending-alder over to minutter, dead letters og p95 ACK-latens over
  60 sekunder. Fravær av sjeldne brukerhandlinger er ikke en alarm.

Queue-meldingen inneholder kun `schema_version`, `attempt_id` og
`adapter_key`; ingen PII. Meta-mappingen bruker bare lovlig tilgjengelige
signaler og konstruerer ikke manglende `_fbc`, `_fbp` eller kontaktdata.
`Purchase`, destination-ID-er, kampanjer, budsjetter og historiske events er
urørt. Microsoft-serverutvidelsen er eksplisitt utsatt til en egen
`pageLoadId`/VID/`msclkid`-kvalitetsport.

Aktiveringen er korrelert gjennom genuine samtykkede brukerhandlinger,
dataLayer, collector, ledger, eksakte attempts, queue-callback og
providerkvitteringer. Appens samme-origin Pixel-bro ble lagt til da livebevis
viste at GTM Custom HTML ikke kjørte til tross for korrekt mapping. Broen og
GTM-templaten deler samme `sent`-register, slik at bare én nettlesereier kan
sende et navn/UUID-par. En ekte `InteractWithAccordion` brukte UUID
`d51aa3ea-a427-4f8a-9098-005f77007626` både i Pixel og CAPI; Meta svarte
`events_received=1` på 250 ms. Datasetets eksterne freshness flyttet seg til
15:40:07Z for browser og 15:41:17Z for server. Se
[release-evidensen](docs/analytics/evidence/canonical-stale-events-near-realtime-cutover-2026-07-26.md).

### AI-kjøpshjelp: intern preview med null som standard

Den nye kjøpshjelpen er en separat, ikke-telemetrisk brukerflyt. Root layout
leser den private serververdien `CUSTOMER_ASSISTANT_ROLLOUT_PERCENT`; manglende
eller ugyldig verdi gir `0` og monterer ingen klientflate. Ved et godkjent
positivt preview velger klienten en stabil bøtte i
`utekos_assistant_bucket_v1`. Samtalen, tilbakemeldingen og browserens lokale
samtaletilstand lever bare i minnet og forsvinner ved reload. En pseudonym UUID-
sesjons-ID opprettes i minnet, men sendes med hver chat-request og skrives sammen
med intent, resultatkode og latency i strukturerte operasjonelle logger. Ingen
samtaletekst går til Supabase, PostHog, GTM, Vercel Analytics eller logger.
Supabase-resultater er utsatt til Release 3.

Den avgrensede request-/response-flyten er:

1. Klienten sender maksimalt 12 tekstmeldinger sammen med transient sesjons-ID,
   aktivt hjelpeformål, pathname og eventuelt produkthåndtak til
   `POST /api/customer-assistant/chat`.
2. Route Handleren eier same-origin-, innholdstype-, 24 KiB-, schema- og
   rate-limit-grensene. Bare eksakt `VERCEL_ENV=preview` sammen med en positiv,
   strengt validert `CUSTOMER_ASSISTANT_ROLLOUT_PERCENT` gir previewgrensen på
   12 forespørsler per minutt per sesjon; øvrige kombinasjoner har grense `0` i
   denne releasen.
3. Ordre, betaling, reklamasjon og persondata går direkte til det eksisterende
   kontaktskjemaet, e-post og telefon uten Shopify- eller modellkall.
4. Produkt-, pris- og tilgjengelighetsinformasjon leses live og ukachet fra
   Shopify Storefront for det aktuelle svaret. Kun `availableForSale` brukes;
   eksakt beholdning vises aldri, og utilgjengelige varianter presenteres ikke
   som kjøpbare.
5. Størrelsesguide, frakt og retur kommer fra de godkjente statiske Utekos-
   kildene. Statisk innhold erstatter aldri en mislykket live pris- eller
   lagersjekk. Ved Shopify-/kunnskapsfeil returneres trygg tekst og menneskelig
   handoff uten oppdiktede kommersielle fakta.
6. Svaret strømmes som typede tekst-, anbefalings-, kilde-, handoff- og
   statusdeler. Klienten renderer bare validerte deler og logger ikke
   samtaleinnhold.

Før et positivt preview kan åpnes for anmeldere, skal Vercel Deployment
Protection være verifisert for preview-deploymenten. Før provideraktivering eller
offentlig eksponering skal tilgang til og retention for de operasjonelle loggene
være eksplisitt verifisert. Ingen allerede konfigurert retentionperiode hevdes
her. Offentlig eksponering krever i tillegg den varige IP-HMAC- og
sesjonslimiteren som eies av Measurement Task 5; den prosesslokale
previewlimiteren er ikke tilstrekkelig.

Rollback er å fjerne rolloutverdien eller sette den til `0` og redeploye det
berørte Vercel-miljøet. Vercel-env-endring og production deploy krever hver sin
eksplisitte godkjenning. Task 7 gjør ingen Vercel-, Shopify-, GCP-, Supabase-,
GTM-, tracking- eller produksjonsmutasjon.

Tracking ble bevisst nullstilt 2026-07-15. Den aktive appflaten etter
resetten består kun av:

- Cookiebot lastet én gang av den publiserte GTM-taggen `126`.
- Synkrone Consent Mode v2-defaults satt til `denied` før GTM.
- Google Tag Manager via førstepartsruten `/__gtg`.
- Google server-side tagging via førstepartsruten `/__sgtm`.

En avgrenset kanonisk storefront-flyt ble reintrodusert og
produksjonsverifisert 2026-07-16 for `page_view`/`view_item`, og er nå
produksjonsaktiv for hele den implementerte commerce-funnelen og øvrige
ikke-blokkerte katalogevents:

- Førsteparts Route Handlers under `/api/events/*` validerer
  samtykkede browser-events og lagrer kanonisk JSONB i
  `marketing.event_ledger`.
- `purchase` og `refund` kommer fra Shopify-webhooks
  (`orders-paid`, `refunds-create`) med operativ ledger og
  consent-gated provider-export.
- Provider-outbox for aktive Google/Meta-par kjøres via registrerte
  workere og `/api/cron/provider-outbox-dispatch`.
- `generate_lead` produseres server-side etter akseptert
  produktventeliste (`product_waitlist_utekos_dun`) og nyhetsbrev
  (`newsletter_signup`): rad i `marketing.leads`, deretter ledger +
  Meta/Google-outbox (samtykkegatet). Microsoft UET for lead går via
  browser `dataLayer` (server-outbox fortsatt `blocked_no_worker`).
- Fire events forblir `blocked_source`:
  `add_shipping_info`, `add_payment_info`, `checkout_error`,
  `payment_error`.

Produksjonsdeployert 2026-07-18 er Meta-attribusjonen utvidet med den
offisielle Parameter Builder-flaten, samtykkestyrte
90-dagers `_fbp`/`_fbc`-cookies, stabil anonym `external_id`, Vercel
IP/UA/geodata i felles Meta-mapping, Meta CAPI PageView-worker og
checkout-attribusjon for både standard Shopify checkout og Klarna Express.
Historiske PageView-rader er beskyttet av claimant-cutover og replayes ikke
automatisk. Se
[audit og releasegater](META_ATTRIBUTION_AUDIT_2026-07-18.md).

Produksjonssettet på 628 Google Data Manager-dead letters er ferdig
klassifisert. 593 av 594 over-lengde-rader ble akseptert etter kontrollert
replay; den siste var historisk payload-inkompatibel. 29 manglet gyldig GA
client ID og 5 var utenfor provider-vinduet; alle ble lukket fail-closed uten
providerkall. To nye clock-skew-rader ble også akseptert etter timestamp-clamp.
Google står nå med 0 failed/dead-lettered og 0 uløste dead letters. Utførte
requests rekonsileres separat via `request_id`: ved kontroll
2026-07-18T21:32Z var 340 providerbekreftet `SUCCESS`, mens 116 var
ikke-terminale og 60 av disse sist var `PROCESSING`. Historiske
`validate_only=true`-rader er ikke kandidater. Purchase-requesten for betalt
ordre `1866` nådde terminal `SUCCESS` på statusforsøk 4 kl. 21:31:06Z.

Meta Dataset Quality har igjen en aktiv, avgrenset snapshot-flyt uten
provider-skriverett. `/api/cron/meta-dataset-quality` leser Meta `v25.0`
med primærkjøring kl. 03:17 UTC;
`/api/cron/meta-dataset-quality-retry` delegerer en idempotent retry til samme
handler kl. 04:17 UTC. Flyten validerer providerresponsen med Zod og lagrer
eventnivåets EMQ, match-key coverage, diagnostikk, event coverage,
dedupliseringsfeedback, freshness og ACR i
`marketing.meta_quality_snapshots`. Før deploy skrev den første
produksjonsverifiserte kjøringen seks rader med måletid
`2026-07-18T21:21:27.253Z`; samme-dags retry skrev 0 duplikater.

GTM får laste før samtykke for Advanced Consent Mode og cookieless
pings. Meta, Microsoft, Clarity og øvrige ikke-Google-tagger skal
fortsatt være blokkert av consent-gates i GTM. `/__sgtm` er alltid
`no-store` og skal aldri returneres som `x-vercel-cache: HIT`.

Den publiserte GTM-containerens Cookiebot-tag `126` er nå den eneste
CMP-loaderen og skal beholdes. Live runtime viste nøyaktig én `uc.js`
med `implementation=gtm`, Consent Mode fra `G100` til `G111` etter
aksept og ingen app-eid duplikatloader.

Følgende tidligere appimplementasjoner er fortsatt fjernet og skal behandles
som åpne gap, ikke som aktive eller verifiserte flater:

- browser tracking hub, direkte Meta/Microsoft/PostHog-klientkode og
  produkt-/kampanje-trackere;
- den tidligere `/api/tracking-events`-huben, consent snapshots, tracking
  receipts og analytics-ruter; ny checkout-attribusjon bruker validerte
  Shopify cart-/draft-order-attributter;
- direkte GA4 Measurement Protocol-transport og Microsoft UET CAPI-adapter;
- tidligere parallelle trackinghuber og transportlag som ikke inngår i dagens
  kanoniske `/api/events/*` + ledger/outbox-flyt.

Supabase er nå kanonisk lager for den reintroduserte eventkatalogen og
provider-outboxen. PostHog kan fortsatt være ønsket produktanalyse,
men må ikke omtales som aktiv storefront-tracking før den er innført
på nytt, samtykkeverifisert og produksjonstestet.

Vercel Web Analytics ble aktivert på prosjektet 2026-07-18. Pakken og
`<Analytics />` er produksjonsdeployert etter at den tidligere
analytics-klienten ble fjernet i resetten 2026-07-15. Vercels
førstepartsskript på `utekos.no` svarer 200. Det kan ikke fylle tilbake
perioden uten innsamling.

## 1. Målbildet: komplett end-to-end-flyt

```mermaid
flowchart TD
  visitor[Kunde / besøkende] --> consent[Cookiebot CMP]
  consent --> browser[Browser tracking hub]
  browser --> dl[Google dataLayer]
  browser --> pixels[Meta Pixel / UET / Clarity]
  browser --> posthog[PostHog produktanalyse]
  browser --> api[/api/events/*]

  api --> ledger[Supabase marketing.event_ledger]
  api --> queue[Supabase ops.provider_dispatch_attempts]
  ledger --> archive[analytics.event_ledger_archive]
  queue --> vercelQueue[Vercel Queue canonical-provider-dispatch-v1]
  vercelQueue --> targeted[Targeted attempt consumer]
  queue --> retry[/api/cron/provider-outbox-dispatch]
  queue --> deadletter[ops.dead_letter_events]
  deadletter --> replay[/api/cron/replay-dead-letter]

  targeted --> meta[Meta CAPI]
  targeted --> google[Google Data Manager API]
  targeted --> microsoft[Microsoft UET CAPI]
  retry --> meta[Meta CAPI]
  retry --> google[Google Data Manager API]
  retry --> microsoft[Microsoft UET CAPI]

  browser --> checkoutCapture[Checkout attribution snapshot]
  checkoutCapture --> shopifyAttributes[Shopify cart / draft-order attributes]

  shopify[Shopify order webhook] --> shopifyAttributes
  shopifyAttributes --> serverPurchase[Server-side purchase dispatch]
  serverPurchase --> ledger
  serverPurchase --> queue

  merchant[Shopify catalog] --> gmc[Google Merchant Center]
  merchant --> msShopping[Microsoft Shopping]

  sentry[Sentry] --> ops[Operational diagnosis]
  vercel[Vercel] --> ops
  posthog --> insight[CRO / funnel / replay / web vitals]
  ledger --> insight
  ops --> action[Agent/MCP decision loop]
  insight --> action
```

Den ønskede flyten er enkel:

1. Brukeren gir eller nekter samtykke.
2. Nettleseren sender kun samtykkede events til riktige
   klientflater.
3. Førsteparts-API-et normaliserer og aksepterer tracking-events.
4. Supabase lagrer fasit, kø, provider-respons og revisjonsspor;
   Vercel Queue vekker det eksakte provider-forsøket nær sanntid.
5. Providerne mottar kvalifiserte events for attribusjon og
   budoptimalisering.
6. PostHog bygger produktforståelse og CRO-innsikt fra trygge,
   eksplisitte events.
7. Sentry, Vercel, web vitals og provider health forklarer
   tekniske avvik.
8. MCP/agent-flaten leser status og gjør funn om til prioriterte
   handlinger.

Flyten er ikke ferdig før dataene blir brukt til konkrete
beslutninger: kampanje- diagnostikk, tracking-reparasjon,
konverteringsoptimalisering, produktforbedring, UX-innsikt og
kapitalallokering.

## 2. Integrasjonenes rolle

| Integrasjon                   | Tenkt rolle                                            | Data inn                                                                                | Data ut / bruk                                                                    | Skal ikke brukes til                                        | Nåværende status                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cookiebot CMP                 | Samtykkekilde og legal gate                            | Brukerens consent state                                                                 | Google Consent Mode, UET consent, Clarity consentv2, service-gating               | Å maskere tekniske feil som "privacy"                       | Aktiv i produksjon; HTML-sjekk fant Cookiebot og ingen Usercentrics-runtime                                                                      |
| Browser tracking hub          | Samlet klientdispatch                                  | Produkt-, side-, interaksjons- og checkout-events                                       | dataLayer og kanoniske `/api/events/*`-kall                                       | Ukontrollert autocapture eller PII                          | Legacy-huben er fjernet; dagens avgrensede kanoniske eventklient er aktiv og samtykkegatet                                                        |
| Supabase                      | Kanonisk ledger, queue, audit og read models           | Accepted events, provider attempts, consent, checkout attribution snapshots, web vitals | Provider health, dead-letter summary, arkiv, agentdiagnostikk                     | Produktanalyse alene eller rå brukerprofiler                | Aktiv og fylt med data; checkout-attribution snapshot er opprettet i production                                                                  |
| Redis                         | Kortlevd attribusjon/runtime state                     | `fbp`, `fbc`, Google `client_id`, `msclkid`, dedupe/idempotency                         | Server-side purchase enrichment, med Supabase snapshot som varig fallback         | Langtidslagring, analysefasit eller rapportering            | Aktiv støttefunksjon; snapshot-fallback er deployet i production, men full purchase-smoke gjenstår                                               |
| PostHog                       | Produktanalyse, webanalyse, funnel, replay, web vitals | Trygge pageviews, web vitals og eksplisitte commerce-events                             | Innsikt, session replay, CRO og adferdsanalyse                                    | Provider-audit, finansiell fasit, PII, rå provider payloads | Storefront-integrasjonen er fjernet etter resetten; skal ikke omtales som aktiv før ny samtykke- og runtimeverifikasjon                            |
| GA4 / sGTM                    | Google-måling og consent-gated browser tagging         | Browser- og server-events                                                               | GA4/Google Ads-import, datalayer-sjekk, Google-optimalisering                     | Ukritisk dobbelttelling med Ads native tags                 | sGTM v29 er live uten legacy MP-tag; Data Manager kjører utførende med kanonisk `transaction_id`, og separat status-cron rekonsilerer request-ID-er til providerbekreftet resultat |
| BigQuery                      | Tung GA4-/ads-/batchanalyse                            | GA4 BigQuery Export, senere andre batchkilder                                           | Kuraterte Supabase read models for session, campaign, landing page og attribution | Live runtime-avhengighet eller rådump i appflyten           | GA4-link er aktiv, men `analytics_489598217` finnes ikke ennå                                                                                    |
| Meta Pixel / CAPI             | Meta-attribusjon og budoptimalisering                  | Kanoniske Pixel/CAPI-events, purchase og samtykkede IDs                                 | Event Match Quality, Dataset Quality, ads learning                                | Automatisk/inferred eventtaksonomi eller skriverett uten godkjenning | Web-GTM v134, app-eid Pixel-bro og 17 Meta CAPI-adaptere er live. Identisk navn/UUID er wire-verifisert for `InteractWithAccordion`; Meta svarte `events_received=1`, og bro/GTM deler duplicate-suppression. |
| Microsoft Ads / UET / Clarity | Bing/Microsoft attribusjon, UET CAPI, Clarity          | UET browser/CAPI, consent, Clarity state                                                | Ads readiness, campaign/ad insight, Clarity diagnose                              | Kun en "UET endpoint" uten Ads-kontekst                     | Read-only Ads-flate er verifisert, men UET CAPI-serveradapter er ikke aktiv etter resetten; historiske kø-rader er lukket fail-closed            |
| Google Merchant Center        | Produktfeed og Shopping-kvalitet                       | Shopify-katalog, GTIN, bilder, kategorier                                               | Product status, Shopping eligibility, feedkvalitet                                | Tracking-lager                                              | Merchant API og API source er OK; kontopolicy må fortsatt verifiseres                                                                            |
| Sentry                        | Feilsporing og teknisk årsak                           | Server/edge/global/client errors                                                        | Issues, request errors, stack traces                                              | Produktanalyse eller session replay uten consent-oppsett    | Server/edge aktiv; Replay er ikke aktivert; Sentry MCP-probe fail-closed                                                                         |
| Vercel                        | Deploy, runtime, produksjonsstatus og egen Web Analytics | Deployment metadata, runtime status og førsteparts sidevisninger                       | Deploy-verifikasjon, produksjonsdiagnostikk og uavhengig trafikksjekk              | Provider-fasit eller erstatning for GA4/Supabase-eventer     | Web Analytics og tracking-runtime er produksjonsdeployert og kontrollert mot eksakt Git-SHA                                                       |
| MCP/agentflater               | Lesbar operasjonell kontrollflate                      | Supabase, PostHog, provider-prober, docs                                                | Diagnose, gapregister, prioritering                                               | Skjulte provider-mutasjoner                                 | 28 commerce/tracking-verktøy OK; flere credential-gated prober fail-closed                                                                       |

## 3. Ønsket flyt steg for steg

| Steg                 | Ønsket tilstand                                                                                                       | Primær kilde / kodeflate                                      | Output som må eksistere                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 0. Consent           | Alle tracking- og replay-systemer starter fail-closed og åpnes kun med riktig service-/kategori-samtykke              | `CookieScript`, `CookiebotConsentProvider`, `cookiebotConfig` | Consent state i browser, provider consent updates, `marketing.consent_snapshots`      |
| 1. Browser capture   | Sidevisninger, produktvisninger, lister, CTA, scroll, add-to-cart, checkout og purchase intent fanges eksplisitt      | `dispatchMetaTrackingEvent`, PostHog helper, dataLayer        | Google dataLayer, Meta Pixel, UET, PostHog commerce-events, first-party tracking call |
| 2. Førsteparts API   | Events valideres, normaliseres og avvises fail-closed ved ugyldig payload eller samtykke                              | `/api/tracking-events` og tracking contracts                  | `marketing.event_ledger` og provider-dispatch rows                                    |
| 3. Supabase ledger   | Alle accepted events og provider attempts er etterprøvbare med tidsstempel, event-id, provider, status og skip reason | `marketing.event_ledger`, `ops.provider_dispatch_attempts`    | Provider health, dead-letter summary, audit trail                                     |
| 4. Provider dispatch | Kvalifiserte events leveres til Meta, Google og Microsoft med retry og korrekt statusklassifisering                   | retry-dispatch, provider adapters                             | `succeeded`, `retrying`, `dead_lettered`, `skipped_unqualified` med grunn             |
| 5. Shopify purchase  | Betalte ordrer kobles til Redis-attribusjon og sendes server-side til providerne uten dobbelttelling                  | `processOrderTrackingWithDependencies`                        | Purchase i ledger, provider attempts, Meta/Google/Microsoft purchase status           |
| 6. PostHog innsikt   | Samme adferd brukes til funnel, web vitals, session replay og CRO uten PII                                            | `PostHogProvider`, `PostHogConsentGate`, commerce helper      | Utekos dashboards, funnels, replay shortlist og web-vitals views                      |
| 7. Produktfeed       | Produktdata er gyldige, dedupliserte og koblet til Shopping-kilder                                                    | Merchant preflight, Shopify catalog sync                      | API source health, product counts, GTIN/category/image status                         |
| 8. Observability     | Tekniske feil, deploys og runtime-regresjoner kobles til tracking-avvik                                               | Sentry, Vercel, provider reports                              | Issues, deployment status, smoke evidence, alerting                                   |
| 9. Agentbeslutning   | MCP/agentlaget kan lese data og gi prioriterte, ikke-destruktive tiltak                                               | Commerce/tracking MCP, Supabase, PostHog                      | Gapregister, action plan, verifikasjonslogg                                           |

## 4. Nåværende verifisert status

Grunnstatus verifisert 2026-07-08 og hendelsesstatus supplert
2026-07-18 med lokale kontroller, MCP/plugin-lesing,
Vercel-logger og Supabase-rapporter. Den godkjente
dead-letter-klassifiseringen var en Supabase dataendring; ingen
skjemaendring eller provider-replay ble utført.

| Område                | Funn                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Meta browser/server-paritet | Web-GTM v134 og appens samme-origin Pixel-bro er live. En ekte Materialer-åpning sendte `InteractWithAccordion` med UUID `d51aa3ea-a427-4f8a-9098-005f77007626` både som Pixel `eid` og CAPI `event_id`; browserpayloaden hadde komplett commerce-/accordionkontekst og CAPI svarte `events_received=1` på 250 ms. Broen og GTM-templaten deler duplicate-suppression. Meta dataset-freshness flyttet seg til 15:40:07Z browser / 15:41:17Z server; numerisk Overlap-UI avventes. |
| Meta Dataset Quality | Første nye read-only Supabase-snapshot er lagret for seks eventtyper. Full providerrespons valideres før lagring; samme-dags retry er idempotent. Post-cutover-kildefordelingen 20:20Z–21:12Z var PageView 75 server/51 browser, ViewContent 75/38 og 2/1 for AddToCart, InitiateCheckout og Purchase. Dette er baseline, ikke ferdig trend. |
| Produksjons-CMP       | `https://utekos.no` returnerte 200 med normal browser headers. HTML inneholdt Cookiebot og ingen Usercentrics-runtime-treff i sjekken.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Produksjonsdeploy     | `dpl_7EvERHHrH7pfAYK7jQcwMySZjD5W` fra SHA `3799e58ac90a4c0177d3bd6fba8a1d2ad3fd2ea2` er `READY` og eier `utekos.no`. Runtime-loggene viser collector `202`, queue-consumer `200` og den samme releasens Pixel-bro levert med `200`. |
| Release-preview       | Vercel deployment `dpl_2kJH2QCPpsaaxx5oDBKD9SuhUt6j` er `READY`. Smoken beviste at Klarna SDK-en initialiserte og rendret en knapp i den gamle produktsideplasseringen; den beviste ikke den tilsiktede flyttingen til produktkort. Preview-domenet er ikke autorisert i Cookiebot og gir derfor forventet preview-varsel; ingen CMP-konfigurasjon ble endret. |
| Klarna-kandidat       | `codex/release-klarna-product-cards` flytter Express Checkout til tilgjengelige produktkort og bruker én delt, idempotent SDK-loader per dokument. En kontrollert browser-smoke med lokal SDK-stub viste tre knapper ved både 390 px og 1440 px, én `<script>`-node og tre container-loads. Read-only Vercel CLI bekrefter at `NEXT_PUBLIC_KLARNA_CLIENT_ID` finnes som sensitiv variabel for både Preview og Production uten at verdien ble eksponert. Dette beviser ikke Klarna-providerens aksept; allowed origins og synlig knapp må fortsatt verifiseres i Git-triggered Preview. Vercel-build feiler lukket dersom identifikatoren mangler. |
| Storefront-kandidat   | `codex/release-storefront-accessibility` retter størrelsevelger, modal-/popover-tokens, alert-dialog-lag, responsiv knappelayout og optimistisk handlekurvfjerning. Browser-smoke på 390 og 1440 px beviste roving tastaturfokus og valgt-markør, stablede mobilknapper, desktopknapper på samme rad, 17,1:1 mørk og 18,0:1 lys modal-kontrast, tilgjengelig navn på fjernknappen, avbryt uten sletting og bekreftet sletting uten applikasjonsfeil. Cookiebot ga kun det forventede localhost-varselet. |
| Lokal integrasjonsaudit | Alle syv storefront-/plattformreleaser og `codex/sgtm-remediation` ble kombinert fra `origin/main`. To dokumentkonflikter ble løst eksplisitt; runtimefilene hadde ingen konflikt. Frossen install uten supply-chain-bypass, 111 endrede tester, MCP build med 52 servere, MCP/commerce doctor, lint av alle endrede kodefiler, TypeScript og Vercel-lignende build med 99/99 statiske sider var grønne. Auditreferansen ble fjernet etter at resultatet var dokumentert; den ble ikke pushet eller deployet. |
| MCP-/driftskandidat   | `codex/release-mcp-operations` er isolert uten butikk-runtime eller unødvendige nye Google-dependencies. MCP build ga 52 servere. Basisdoctor, commerce 28/28, Shopify read-only, Codex bridge med secret-denial, offisiell Google Analytics 0.6.0 med 9/9 tools og live Utekos-rapport, privat Analytics-proxy og syv sGTM-loaderendepunkter er grønne. TypeScript og build 95/95 passerer. Samlet ChatGPT-profildoctor er fortsatt blokkert av eldre Insight-surface og stoppet Docker Desktop, mens alle nye profiler passerer separat. |
| Kildehygiene          | `codex/release-source-hygiene` fjerner bare en kommentar og retter dobbel semikolon i den allerede anvendte migrasjonen `20260711190423`. Migration list viser samme versjon lokalt og remote, linked lint for `analytics,commerce,marketing,ops,partner,public` er grønn, og ingen Supabase-mutasjon er utført. Den brede kandidatens PostHog minimum-age-bypass ble eksplisitt avvist fordi frossen install passerer uten unntaket. |
| Checkout snapshot     | `TRACKING_COMMERCE_SMOKE_SYNTHETIC_IDS=1 npm run tracking:commerce-smoke` 2026-07-08T20:41Z beviste ny samtykket checkout-capture i production. `marketing.checkout_attribution_snapshots` fikk 1 rad for `begin_checkout` med `msclkid`, GA client/session id, Meta `fbp`, external id og lookup-token.                                                                                                                                                                                                                                                                        |
| Betalt Meta-klikkreise | Shopify-ordre `1866` er `PAID` med `SALE/SUCCESS`, `test=false`. Den samtykkede Facebook-landingen gikk fra kanonisk `begin_checkout` til webhook-`purchase` på 36 sekunder. Checkout, Shopify custom attributes og Purchase hadde identiske `external_id`, `_fbp`, `_fbc` og `fbclid`. Meta svarte `eventsReceived=1`, uten messages og med trace-ID på første forsøk. Google Data Manager beholdt request-ID-en og bekreftet terminal `SUCCESS` på statusforsøk 4 uten feil. |
| Klarna Express live   | Production Client ID/servercredentials validerer fail-closed, og Express åpner ekte Klarna/BankID med korrekt merchant-URL. Ingen reell betaling ble initiert av agenten. Read-only scan fant ingen post-release Klarna-ordre som kan bevise hele Klarna → Shopify → purchase-webhook-kjeden. |
| Shopify historikk     | Full Shopify-historikk er importert til `commerce`: 804 ordre og 1222 linjevarer. Attribution-readiness viser 535 ordre med `missing_ga_client_id`, 263 med `missing_paid_click_id`, 4 `ready_for_provider_repair` og 2 med `missing_meta_browser_ids`.                                                                                                                                                                                                                                                                                                            |
| GA4 BigQuery          | `npm run ops:ga4-bigquery-readiness` 2026-07-08T20:48Z er read-only og bekrefter at `project-c683eb2c-20ae-4ec2-ac3:analytics_489598217` fortsatt ikke finnes/ikke er lesbart. Ingen Supabase BigQuery-wrapper eller GA4-read-models skal bygges før dataset og `events_*`/`events_intraday_*` finnes.                                                                                                                                                                                                                                                                           |
| sGTM                  | Syv offentlige loaderendepunkter, inkludert health, Cookiebot-signaler, GTM, noscript, begge Google-tagloadere og Google Ads, returnerte 200. Releasekandidaten er likevel ikke produksjonsklar før migrasjon `20260712120000`, receipt-secret/Vercel-env, Cloud Run-hardening og koordinert GTM-publisering er godkjent og verifisert. Lokal GTM-smoke viser at appens Cookiebot-loader og den ennå publiserte GTM-taggen `126` laster CMP dobbelt; den planlagte slettingen av GTM-taggen må derfor inngå i den koordinerte releasen. |
| Replay route          | Den feilkonfigurerte tilbakevendende Vercel-cronen er fjernet i produksjon. `/api/cron/replay-dead-letter` beholdes som secret- og godkjenningsgated manuell engangskjøring; 2026-07-14-planen var read-only og fant 0 kandidater.                                                                                                                                                                                                                                                                                                                                      |
| Supabase volum        | `marketing.event_ledger` ca. 10 584 rader, `ops.provider_dispatch_attempts` ca. 12 023, `ops.web_vitals` ca. 12 792, `marketing.consent_snapshots` ca. 9 717, `marketing.website_visitor_events` ca. 6 122.                                                                                                                                                                                                                                                                                                                                                        |
| Ledger siste 7 dager  | Ca. 923 events. Størst volum: `PageView`, `ViewContent`, `ViewItemList`, `LandingScrollDepth`, `LandingSectionView`, `LandingCTAClick`, `AddToCart`, `InitiateCheckout`, `Purchase`.                                                                                                                                                                                                                                                                                                                                                                               |
| Identifier coverage   | `npm run ops:identifier-coverage-report` 2026-07-08T20:42Z viser 804 historiske Shopify-ordre, 269 med GA client id, 370 med Meta browser ids, 8 med paid click id, 1 checkout snapshot og 4 ordre `ready_for_provider_repair`. Snapshot-dekningen for den nye smoke-raden er 100% for GA client/session id, Meta `fbp`, external id, Microsoft `msclkid` og paid click id.                                                                                                                                                                                                 |
| Provider health       | Cutover-kontrollen 2026-07-26 viste 190 `accepted_unverified`-samples, p95 ACK `5 750 ms`, 0 initial-pending over to minutter, 0 nye dead letters og 0 canonical events uten provider-attempt. Google `PROCESSING` forblir korrekt ikke-terminalt til statusjobben bekrefter `SUCCESS`. |
| Dead letters          | De 48 Google `page_location`-radene ble 2026-07-14 klassifisert `historical_ga4_page_location_payload_bug` og lukket uten replay. Alle var utenfor Googles 72-timers replayvindu, den scoped produksjonsrettingen hadde ingen nye tilsvarende feil, og read-only replay-planen viser nå 0 unresolved og 0 kandidater.                                                                                                                                                                                                                                                |
| Migrasjonshistorikk   | Fem produksjonsmigrasjoner som manglet i `origin/main` er hentet tilbake som lokale SQL-filer og committed i release-kandidaten uten Supabase-mutasjon. Fire av dem hadde ligget ucommittet i en separat worktree; den femte var den allerede verifiserte ACL-herdingen for arkivfunksjonen.                                                                                                                                                                                                                                                                     |
| Klientfeilstøy        | Vercel-loggen dokumenterte 17 `DataCloneError`-poster fra 16 extension-id-er; alle hadde `chrome-extension://.../src/setup.js` som `ErrorEvent.filename`, mens 9 også hadde Clarity dypere i stacken. Lokal filtergrense bruker den verifiserte extension-origin-en i både egen beacon og Sentry; identisk feil fra førsteparts-URL beholdes.                                                                                                                                                                                                                                                     |
| Commerce/tracking MCP | `npm run mcp:commerce-tracking:doctor` passerte tool-surface-gaten med 28 read-only tools.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Live provider-prober  | Shopify, GA4, Vercel, public sGTM/GTM, autentisert GTM API workspace, Meta Dataset Quality, Microsoft UET endpoint, Microsoft Ads auth/account/campaign/ad insight, Microsoft Shopping Content og Microsoft Clarity var OK i siste doctor-kjøring. |
| Fail-closed prober    | Merchant Center MCP-proben, Google Ads-prober, PostHog project/event status i lokal commerce MCP og Sentry hadde fortsatt credential/scope-gated fail-closed status. |
| Merchant preflight    | Merchant API virker. API primary product source og autofeed er synlige. 16 managed products, 15 med GTIN. Kontopolicy må likevel verifiseres separat.                                                                                                                                                                                                                                                                                                                                                                                                              |
| PostHog plugin        | Aktivt prosjekt har event-inntak. Siste 30 dager viste mye `$pageview` og `$web_vitals`, men få eksplisitte `utekos_*` commerce-events og ingen dedikerte Utekos CRO-/checkout-dashboard funnet i søk.                                                                                                                                                                                                                                                                                                                                                             |
| Sentry                | Server/edge/global error-instrumentering finnes i kode. Client replay er ikke aktivert, og lokal Sentry-probe er fail-closed.                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## 5. Avvik mot ønsket flyt

| Steg                 | Hva som fungerer nå                                                                | Avvik / svakhet                                                                                                                                                                                                                                            | Hvorfor det betyr noe                                                                                                  | Lukkekriterium                                                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Consent           | Cookiebot er aktiv i produksjon og kode oppdaterer Google, UET og Clarity consent. | Full produksjons-smoke må fortsatt validere alle service-navn mot Cookiebot admin og provider behavior.                                                                                                                                                    | Feil service-navn kan gi enten tapt tracking eller uønsket tracking.                                                   | Browser-smoke viser korrekt denied/accepted for Google, Meta, Microsoft, Clarity, PostHog og Sentry Replay før endring regnes som trygg. |
| 1. Browser capture   | Den kanoniske eventklienten sender samtykkegatet dataLayer, first-party events og Meta Pixel-paritet. | PostHog og Microsoft-klientflaten er ikke reintrodusert som full aktiv storefrontflyt. | Produktanalyse og Microsoft-dekning er svakere enn den verifiserte Meta/Google-flyten. | Hver gjeninnført klientflate har eksplisitt consent-, network- og providerbevis. |
| 2. Førsteparts API   | Supabase får accepted events og provider rows.                                     | Kvaliteten på identifier-capture er ikke god nok for alle provider-dispatcher.                                                                                                                                                                             | Historiske Google-rader med manglende `client_id` og Microsoft-skips viser at events ikke alltid kan optimalisere bidding. | Missing identifier rates synker til avtalt terskel og kvalifiseres som `skipped_unqualified` der det er forventet.                       |
| 3. Supabase ledger   | Ledger, queue, health views, dead-letter views og arkiv finnes.                    | Supabase-data brukes for lite som løpende operasjonell alarmflate.                                                                                                                                                                                         | Data samles inn, men for sent eller manuelt omsatt til handling.                                                       | Ekstern alert/dashboard finnes for queue, dead letters, provider fail rate, purchase delivery og web vitals.                             |
| 4. Provider dispatch | Meta/Google er aktive; Data Manager-radgjeld og historiske Meta/Microsoft-kørader er klassifisert og lukket uten blind replay. | Google/Meta har 0 failed/dead-lettered og 0 uløste dead letters. Utførte Google-requests med `PROCESSING` er korrekt ikke-terminale; Microsoft-adapteren er fortsatt fraværende. | `PROCESSING` må ikke fremstilles som levert, og et tomt feiltall må ikke forveksles med Microsoft-levering. | La statuscronen flytte bare `SUCCESS` til providerbekreftet, behold Meta/Google på null feil og reintroduser Microsoft-adapter eksplisitt før Microsoft serverlevering markeres grønn. |
| 5. Shopify purchase  | En ekte, samtykket Meta-klikkreise har bevist standard Shopify checkout → betalt Purchase med identisk `external_id`, `_fbp`, `_fbc` og `fbclid` i checkout, Shopify-attributter og webhook-event. Meta mottok eventet på første forsøk, og Google bekreftet samme Purchase som terminal `SUCCESS`. | Betalt Klarna Express er ikke observert, og Microsoft UET CAPI-adapter er ikke aktiv. | Purchase-events er de viktigste signalene for budoptimalisering og kapitalallokering. | Observer en separat betalt Klarna-reise og reintroduser/verifiser Microsoft UET CAPI før full tre-provider-dekning hevdes. |
| 6. PostHog innsikt   | PostHog mottar pageviews og web vitals, og init er consent-gated/masket.           | Dedikerte CRO-, checkout-, UTM- og revenue-flater er ikke etablert. Lokal commerce MCP har PostHog fail-closed.                                                                                                                                            | Data blir liggende som rå analyse i stedet for å drive beslutninger.                                                   | PostHog project/event-prober er grønne, og dashboards/funnels brukes i ukentlig CRO-/trackinggjennomgang.                                |
| 7. Produktfeed       | Merchant API pr eflight er grønn, API source og autofeed er synlige.               | Kontopolicy/Misrepresentation-status er ikke bevist grønn i fersk kontroll, og dual source kan fortsatt gi styringsrisiko.                                                                                                                                 | Shopping-eligibility og produktdistribusjon kan være begrenset selv om feeden teknisk prosesseres.                     | Merchant UI/API-policystatus dokumenteres grønn, og ønsket kildeeierskap mellom API source og autofeed er avklart.                       |
| 8. Observability     | Sentry server/edge/global error finnes; Vercel-proben er grønn.                    | Sentry Replay er ikke aktivert og issue-probe er fail-closed.                                                                                                                                                                                              | Kritiske frontend-/checkoutfeil kan mangle replay-kontekst.                                                            | Sentry org/project/issue-probe er grønn, og Replay er enten bevisst aktivert med Cookiebot-gate eller eksplisitt parkert.                |
| 9. Agentbeslutning   | MCP doctor passerer tool-surface og flere provider-prober er grønne.               | Flere read-only prober mangler credentials/scopes: Google Ads, GTM API workspace, Sentry og lokal PostHog.                                                                                                                                                 | Agentlaget får hull i "single pane of glass" og kan ikke alltid skille reelle feil fra manglende tilgang.              | Credential-gated prober er enten grønne eller dokumentert fail-closed med nøyaktig eier og neste steg.                                   |

## 6. Hvor dataene går, og om de utnyttes godt nok

### Supabase

Data sendes til Supabase fordi det er eneste sted som kan være
intern fasit for hva appen aksepterte, hva som ble forsøkt sendt,
hva providerne svarte, og hva som må repareres. Det er riktig
arkitektur.

Det som fungerer:

- `marketing.event_ledger` viser accepted tracking-events.
- `ops.provider_dispatch_attempts` viser provider-kø og
  provider-resultater.
- `ops.provider_dispatch_health` og `ops.dead_letter_summary` gir
  read models for drift.
- `marketing.consent_snapshots`, `ops.web_vitals`,
  `marketing.website_visitor_events` og
  `marketing.attribution_events` gir ekstra innsikt og revisjon.
- `analytics.event_ledger_archive` og pg_cron-arkivering finnes
  for kald lagring.

Det som ikke er godt nok:

- Dead-letter-backloggen er klassifisert og lukket, og provider-
  rapporten er grønn. Videre arbeid gjelder permanent varsling og
  dashboard, ikke uløste rader.
- Det finnes rapportskript, men ikke nok bevis på permanent
  dashboard/alert-loop.
- Flere tabeller er schema-only eller underutnyttet, blant annet
  deler av `partner`, `analytics` og `leads`.
- Radvolum alene sier lite uten årsak, provider, replay-policy og
  konsekvens.

Konklusjon: Supabase brukes riktig som lager, men ikke godt nok
som kontinuerlig operasjonell styringsflate.

### PostHog

Data sendes til PostHog fordi Supabase ikke skal være
produktanalyseverktøyet. PostHog skal svare på spørsmål som:

- Hvor faller brukere fra?
- Hvilke produktlister, CTA-er og landingssider skaper handling?
- Hvilke sessions bør sees i replay?
- Hvilke web-vitals-problemer korrelerer med lavere intent?
- Hvilke UTM-/kampanjeinnganger gir faktisk bedre produktadferd?

Det som fungerer:

- PostHog init er consent-gated.
- Autocapture er av.
- Pageviews er manuelle.
- Replay er strengt masket når det brukes.
- URL-er renses for query string.
- Commerce-helperen sender trygge, eksplisitte properties.

Det som ikke er godt nok:

- Det er ikke funnet dedikert Utekos-dashboard for funnel,
  checkout, produkt, landing page, UTM eller replay-prioritering.
- Volumet av eksplisitte `utekos_*` commerce-events er lavt
  sammenlignet med pageviews og web vitals.
- Lokal commerce MCP har PostHog project/event-status
  fail-closed, selv om plugin-tilgang viser at prosjektet har
  data.

Konklusjon: PostHog er riktig verktøy, men er ennå ikke fullt
utnyttet som CRO- og kundeinnsiktsmotor.

### Redis

Redis skal ikke være analyse- eller rapporteringslager. Redis er
runtime-støtte for å knytte senere server-events til tidligere
browser-attribusjon.

Riktig bruk:

- Midlertidig lagring av `fbp`/`fbc`, Google `client_id`,
  `msclkid` og event-/order-dedupe.
- Beriking av Shopify purchase-webhooks før server-side provider
  dispatch.
- Speiling til `marketing.checkout_attribution_snapshots` og
  `marketing.checkout_attribution_lookup_tokens`, slik samme
  payload kan finnes igjen etter Redis-expiry eller
  token-mismatch.

Svakhet:

- Når Redis mangler attribution identifiers, kan provider-events
  bli `skipped_unqualified` eller dead-lettered.
- Runtime-koden har Supabase snapshot-fallback og er deployet i
  production. Neste gate er full purchase-smoke og
  coverage-måling, ikke ny deploy alene.
- Dette er ikke en Redis-feil alene; det er en
  capture-/consent-/identifier-flow som må måles end-to-end.

Konklusjon: Redis er en nødvendig koblingsmekanisme, mens
Supabase er langtidsfasiten. De må vurderes gjennom identifier
coverage og purchase match rate, ikke radtall.

## 7. Prioritert gap-register

| Prioritet | Gap                                     | Nåværende evidens                                                                                                        | Neste handling                                                                                                                              | Gate                                                                                                     |
| --------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Lukket 2026-07-14 | Google `page_location` dead letters | 48 historiske rader er klassifisert/lukket uten replay; sentral sanitizer er deployet, og etterdeploy-rapporten har 0 failed/dead-lettered, 0 unresolved og 0 alerts | Overvåk samme rapportgate og alarmér på nye avvisninger | Fortsatt 0 nye feil med samme grunn og grønn `--fail-on-alerts` |
| P0        | Microsoft UET CAPI purchase-adapter reintrodusert i kode | Purchase-serverworker er registrert (`microsoft_uet:purchase`) med fail-closed skip for `missing_msclkid` / `missing_capi_token`. Øvrige Microsoft-events forblir `blocked_no_worker`. | Produksjonsdeploy + samtykket Microsoft-klikkreise purchase smoke som viser Microsoft-rad `accepted_unverified`/`succeeded` (ikke bare lokal unit test). | Ny kvalifisert purchase med `msclkid` og UET ApiToken i Vercel Production viser Microsoft UET CAPI-leveranse, eller skip_reason er eksplisitt. |
| P0        | Merchant policy / feed ownership        | Merchant API preflight OK, men policy-status ikke ferskt bevist grønn                                                    | Verifiser Merchant Center policy og avklar API source vs autofeed                                                                           | Merchant UI/API policy evidence lagres i runbook                                                         |
| P1        | PostHog CRO-loop mangler                | Data finnes, men få `utekos_*` commerce-events og ingen dedikerte dashboards funnet                                      | Bygg dashboards/funnels for landing, product, checkout, campaign og replay shortlist                                                        | Ukentlig innsiktsflate kan svare på hvor og hvorfor brukere faller fra                                   |
| P1        | Supabase-operasjonalisering             | 15-minutters Sentry-health er deployert; direkte produksjonskontroll viser p95 5,75 s og null pending/dead-letter/manglende attempt | Bekreft første planlagte cronkjøring i driftsloggen og koble alertene til fast operativ oppfølging                                         | Varsel/rapport viser korrekt tilstand uten lavvolums-heartbeats eller PII                                 |
| P1        | Commercial intelligence-plan            | Ny styringsplan er opprettet, men read models, agentfunn og workflows er ikke implementert                               | Følg [COMMERCIAL_INTELLIGENCE_PLAN.md](COMMERCIAL_INTELLIGENCE_PLAN.md) og bygg ett verifisert spor av gangen                               | Supabase/PostHog/MCP-flater viser konkrete beslutninger, ikke bare datainnsamling                        |
| P1        | GA4 BigQuery -> Supabase                | `npm run ops:ga4-bigquery-readiness` bekrefter `ga4_bigquery_dataset_missing`; `analytics_489598217` finnes ikke ennå     | Rerun readiness-gaten til dataset og `events_*` finnes; først da bygg read-only wrapper/read models                                          | Kuraterte read models finnes; rå GA4-dump er ikke app-avhengighet                                        |
| P1        | Google Ads API read-only prober         | GA4, public sGTM og GTM API workspace er grønne, men flere Google Ads-spørringer returnerer fortsatt strukturerte credential/scope-feil | Rett credentials/scopes eller dokumenter blokkering | Prober skiller tydelig mellom teknisk feil og manglende tilgang |
| P1        | Identifier coverage                     | Siste Meta-øyeblikksbilde: PageView EMQ 6.6, ViewContent 5.5, AddToCart 6.3, InitiateCheckout 5.9 og Purchase 9.3. Pixel-pariteten er direkte bevist. Daglig Dataset Quality-snapshot er reintrodusert og første seks-raders baseline er lagret; post-cutover-kildefordelingen er fortsatt lav for lower funnel. | La snapshot-cronen samle 7 og 14 dager; mål `client_id`, `fbp`, `fbc`, `external_id` og betalt klikk-ID per event og les kildefordelingen på nytt med større etterreleasevolum. | Coverage-rapport per eventtype og consent state med tilstrekkelig denominator. |
| P2        | Sentry Replay                           | Sentry server/edge aktiv, Replay ikke aktivert                                                                           | Beslutning: aktivere med Cookiebot statistics gate eller eksplisitt parkere                                                                 | Replay status dokumentert; ingen antatt dekning                                                          |
| P2        | Underbrukte tabeller                    | Flere partner-/analytics-/lead-tabeller står tomme                                                                       | Fjern, parker eller koble til konkret bruk                                                                                                  | Ingen schema-only dataløfter uten eier                                                                   |

## 8. Verifikasjonskommandoer

Bruk disse ved endringer i tracking, providerflyt, MCP, Supabase
eller observability.

```bash
npm run mcp:build
npm run mcp:doctor
npm run mcp:commerce-tracking:doctor
npm run ops:identifier-coverage-report -- --json
npm run ops:identifier-coverage-report -- --fail-on-alerts
npm run ops:provider-dispatch-report -- --json
npm run ops:provider-dispatch-report -- --fail-on-alerts
node scripts/ops/dead-letter-replay-plan.mjs --limit=40
npm run merchant:preflight
```

Ved nettleser-/produksjonssmoke må følgende bevises før endring
regnes som ferdig:

- Cookiebot denied/accepted state.
- Google Consent Mode og dataLayer-event.
- Meta Pixel og/eller CAPI evidence.
- Microsoft UET browser og eventuell CAPI evidence.
- Clarity Consent API V2.
- PostHog init, masking og manuelt pageview/commerce-event.
- Supabase row i ledger og provider attempts.
- Provider dashboard/API-status der credentials tillater det.

Live provider- eller produksjonsmutasjoner krever eksplisitt
godkjenning før kjøring. Dette inkluderer deploy, GTM publish,
Supabase schema mutation, provider resource write, campaign write
og replay av dead letters.

## 9. Historikk: foreldet eller løst innhold

Disse punktene skal ikke lenger stå som aktive avvik uten ny
evidens:

- "Produksjon kjører fortsatt gammel Usercentrics-runtime" er
  foreldet. Siste produksjons-HTML-sjekk viste Cookiebot og ingen
  Usercentrics-runtime.
- "Vercel deployment status probe er ikke verifisert" er foreldet
  for siste commerce doctor. Vercel-proben var OK.
- "Microsoft Ads account/campaign/ad insight er ikke verifisert"
  er foreldet for siste commerce doctor. Microsoft Ads auth
  readiness, account access, campaign status og Ad Insight var
  OK.
- Gamle resolved Meta-token-expired rows skal ikke telles som
  aktive feil uten unresolved status.
- De 382 radene fra 2026-07-08 og de 48 Google `page_location`-
  radene som ble klassifisert 2026-07-14 er historisk lukket uten
  provider-replay. Dead-letter-registeret er igjen grønt med 0
  unresolved. Replay-ruten forblir secret- og godkjenningsgated og
  ligger ikke i Vercels tilbakevendende cronplan.
- "Supabase checkout snapshot-fallback er ikke live før Vercel deploy" er
  foreldet. Standard Shopify checkout er bevist med `_fbp`, `_fbc`, `fbclid`
  og `external_id` i cart attributes. Betalt ordre `1866` beviste de samme
  fire verdiene i checkout, Shopify-attributter og Purchase. Meta bekreftet
  mottak; Google beholdt request-ID-en og bekreftet terminal `SUCCESS` på
  statusforsøk 4 uten feil.
- Chatbase skal behandles som legacy. Ny AI-kundeservice må
  planlegges separat og skal ikke blandes inn som aktiv
  analytics-flyt.

Punkter som fortsatt ikke kan markeres løst uten ny kontroll:

- Merchant Center kontopolicy og eventuell
  Misrepresentation-status.
- Google Ads API credentials/scopes.
- En godkjent betalt Klarna Express-reise gjennom Shopify-webhooken.
- Sentry issue-probe og eventuell Sentry Replay.
- Microsoft UET CAPI purchase etter at serveradapteren er reintrodusert.
- Dataset Quality-trend etter 7 og 14 daglige snapshots for events med lavt
  etterreleasevolum; første baseline er lagret.
- PostHog-dashboards/funnels som faktisk brukes til CRO og
  kundeinnsikt.

## 10. Neste praktiske rekkefølge

1. Etter separat godkjenning: publiser den upubliserte GTM-mappingen, deploy
   queue-/runtime-kandidaten og bevis genuine events ende til ende med samme
   Meta-navn og ID. Oppdater evidensnotatet med GTM-versjon, deployment-ID,
   event-ID-er og receipts.
2. Følg Meta Dataset Quality-snapshotserien etter 7 og 14 dager og observer en
   godkjent betalt Klarna Express-reise uten syntetisk betaling.
3. Vent på og verifiser GA4 BigQuery-datasettet, deretter bygg
   kuraterte Supabase read models.
4. Verifiser Merchant Center policy og kildeeierskap.
5. Bygg PostHog CRO-/commerce-dashboard og koble til ukentlig
   analyseflyt.
6. Løft Supabase provider health til fast alert/dashboard.
7. Rydd credential-gated MCP-prober slik at agentlaget kan skille
   tilgangsfeil fra reelle trackingfeil.
8. Reintroduser Microsoft UET CAPI som en separat, dokumentert release.
9. Ta beslutning om Sentry Replay med korrekt Cookiebot-gate.
