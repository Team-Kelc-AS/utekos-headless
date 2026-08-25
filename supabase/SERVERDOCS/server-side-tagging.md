# `cloud.server.utekos.no`: faktisk dataflyt, status og gap

Statusdato: 2026-07-12.

Dette er den prosjektspesifikke fasiten for Utekos sin
server-side Google Tag Manager-flyt. Dokumentet supplerer
[FLOW.md](../../FLOW.md): `FLOW.md` beskriver hele
telemetry-systemet, mens denne filen forklarer nøyaktig hva
`cloud.server.utekos.no` gjør, hvilke events som faktisk går
gjennom domenet, hvilke parallelle spor som omgår det, og hvilke
avvik som må lukkes.

Ingen reelle brukeridentifikatorer, rå e-postadresse, telefon,
session-ID, URL med identifikator eller annen persondata er
gjengitt i dette dokumentet. Den syntetiske audit-ID-en `555` er
dokumentert separat.

## Kort fasit

`cloud.server.utekos.no` er i dag **ikke** Utekos sitt sentrale
server-tracking-knutepunkt. Det har tre reelle roller:

1. Det serverer Google-avhengigheter som `gtm.js` og `gtag.js`
   fra et førsteparts-subdomene.
2. Det mottar Google browser-hits på `/g/collect` og lar sGTM sin
   GA4-klient sende dem videre til GA4.
3. Det tilbyr helse-, preview- og hjelpeendepunkter for sGTM.

Supabase-flyten er separat. Nettleseren sender samme
forretningshendelse til `/api/tracking-events`, som lagrer den i
Supabase og for flere Google-events også sender den direkte til
GA4 Measurement Protocol. Dette er ikke en feilutløst
reservekanal: i nåværende kode er det en ubetinget parallell
kanal. Resultatet er dokumentert dobbelttelling.

Tre forhold gjør at nåværende produksjon ikke kan regnes som
korrekt:

- Google-taggen samler automatisk rå brukeroppgitt e-post og
  sender den som URL-parameter til Cloud Run. Request-logger har
  lagret slike verdier også med `gcs=G100`, `npa=1` og
  denied/default-mønstre i `gcd`. Dette er et P0 personvern- og
  datastyringsavvik; full consenttolkning skal bekreftes i Tag
  Assistant fordi kodingen kan endres.
- `page_view` har tre aktive produsenter. En konservativ
  logganalyse klassifiserte 1 322 pageview-hits som
  kandidatduplikater innen ett sekund, 40,3 % av alle
  pageview-requests i kontrollvinduet.
- Kanoniske commerce-events sendes både gjennom sGTM og direkte
  Measurement Protocol. sGTM-hits mangler dokumentert `event_id`,
  og GA4 dedupliserer ikke vanlige events etter `event_id`.

Endpoint-health er grønn. Datakorrekthet, personvern og
event-eierskap er ikke grønt.

## Verifisert produksjonsidentitet

| Flate                        | Verifisert verdi                             |
| ---------------------------- | -------------------------------------------- |
| Førstepartsdomene            | `https://cloud.server.utekos.no`             |
| GCP-prosjekt                 | `project-c683eb2c-20ae-4ec2-ac3`             |
| Region                       | `europe-west1`                               |
| Cloud Run live               | `gtm-server`                                 |
| Cloud Run preview            | `gtm-preview`                                |
| Direkte live-URL             | `https://gtm-server-rojbi5yl5q-ew.a.run.app` |
| Web-GTM                      | `GTM-5TWMJQFP`                               |
| Web-GTM account/container    | `6295468138` / `220236256`                   |
| Publisert web-versjon        | `107`                                        |
| Web workspace/status         | `109`, rent                                  |
| Server-GTM public ID         | `GTM-M8GT97CV`                               |
| Server-GTM account/container | `6333110851` / `248521914`                   |
| Publisert server-versjon     | `22`                                         |
| Server workspace/status      | `23`, rent                                   |
| Kanonisk Google-tag          | `GT-MKRLF5WK`                                |
| GA4 measurement ID           | `G-FCES3L0M9M`                               |
| Google Ads destination       | `AW-18180376403`                             |
| Kanonisk audit-lager         | Supabase `hkoawfbomhnzupcsdggb`              |

Dokumentasjon som fortsatt sier at live web-versjon er `102`, at
workspace `106` venter på publisering, eller at server-versjon
`17` er siste versjon, er foreldet.

## Den faktiske flyten

```mermaid
flowchart TD
  visitor[Besøkende] --> defaults[Consent defaults: denied]
  defaults --> cmp[Cookiebot]

  visitor --> loader[cloud.server.utekos.no/gtm.js]
  loader --> webgtm[Web-GTM v107]

  app[React tracking-kode] --> dl[dataLayer]
  webgtm --> googleTag[Google tag 109]
  dl --> gaEvent[GA4 event-tag 118]
  googleTag --> collect[cloud.server.utekos.no/g/collect]
  gaEvent --> collect
  collect --> gaClient[sGTM GA4 client]
  gaClient --> serverTags[sGTM GA4 tags]
  serverTags --> ga4[Google Analytics 4]

  app --> api[/api/tracking-events]
  api --> ledger[Supabase event_ledger]
  api --> queue[Supabase provider_dispatch_attempts]
  queue --> retry[retry-dispatch]
  retry --> directMP[www.google-analytics.com/mp/collect]
  directMP --> ga4

  cartAction[Add-to-cart server action] --> directMP
  shopify[Shopify paid webhook] --> purchaseMP[Direkte purchase MP]
  purchaseMP --> ga4

  webgtm --> uetGtm[Microsoft UET GTM-tags]
  app --> uetApp[Microsoft UET app-tags]
  uetGtm --> bing[Microsoft]
  uetApp --> bing
```

Det kritiske skillet er:

- `dataLayer` er en intern browser-kø, ikke et endepunkt.
- `cloud.server.utekos.no` ser bare requests som
  web-GTM/Google-taggen faktisk lager til server-containeren.
- `/api/tracking-events` og Supabase-køen går ikke gjennom sGTM.
- Et grønt sGTM health-endepunkt beviser derfor verken at et
  business-event kom frem, at provider mottok det, eller at det
  ikke ble sendt flere ganger.

## Hva domenet mottar

### Infrastruktur- og dependency-requests

| Endepunkt                    | Faktisk rolle                    | Brukt av produksjonsappen?                                | Status 2026-07-12 |
| ---------------------------- | -------------------------------- | --------------------------------------------------------- | ----------------- |
| `/healthy`                   | Cloud Run/sGTM health            | Kun helseverifikasjon                                     | 200, `ok`         |
| `/gtm.js?id=GTM-5TWMJQFP`    | Førsteparts web-container-loader | Ja                                                        | 200               |
| `/gtag/js?id=GT-MKRLF5WK`    | Førsteparts Google-tag-loader    | Indirekte via Google-tag-konfigurasjon                    | 200               |
| `/gtag/js?id=GT-P3JGLNDZ`    | Sekundær Google-tag-loader       | Tillatt av server-client; aktiv bruk må bevises per hit   | 200               |
| `/gtag/js?id=AW-18180376403` | Google Ads loader                | Tillatt av server-client                                  | 200               |
| `/ns.html?id=GTM-5TWMJQFP`   | GTM noscript-iframe              | Nei; komponenten har ingen call site                      | 200               |
| `/uc-consent-signals.js`     | Cookiebot category-cookie helper | Nei; ingen app-, HTML- eller web-GTM-referanse ble funnet | 200               |

`/ns.html` og `/uc-consent-signals.js` er eksempler på at «HTTP
200» ikke er det samme som «operativt brukt».

### Measurement-requests

Browserens Google-tag sender GET/POST-lignende måletrafikk til
`/g/collect`. GA4-klienten i server-containeren krever requesten,
parser den til sGTM event data og kjører server-tags.

Requesten kan inneholde blant annet:

- eventnavn;
- pseudonym Google client-ID og session-ID;
- consent-signaler som `gcs` og `gcd`;
- side-URL og referrer;
- device- og nettlesermetadata;
- ecommerce-felter som currency, value, transaction ID og items;
- event-parametere og automatisk innsamlede parametere.

Dette er persondata i GDPR-forstand selv når Google ikke
klassifiserer alle feltene som PII. Rå e-post skal aldri ligge i
measurement-URLen eller i Cloud Run request logs.

### Server-to-server-klient som ikke brukes

Server-containeren har en Measurement Protocol-client på
`/mp/collect`, men appen sender til
`https://www.google-analytics.com/mp/collect`. Følgende går
derfor utenom `cloud.server.utekos.no`:

- Supabase sin Google retry-kø;
- `addCartLinesAction` sin direkte `add_to_cart`;
- newsletter/server-events som bruker `trackServerEvent`;
- Shopify paid-webhook sin server-side `purchase`.

Dette er ikke automatisk feil. Direkte Measurement Protocol kan
være riktig for ekte server-/offline-hendelser. Avviket er at
klienten finnes uten en besluttet rolle, samtidig som
browser-events sendes begge veier.

## Live GTM-konfigurasjon

### Web-container v107

Den publiserte web-resource-konfigurasjonen viser:

| ID        | Rolle                             | Trigger / virkning                                                                                                                          |
| --------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Tag `107` | Conversion Linker                 | Fyrer på alle sider                                                                                                                         |
| Tag `109` | Kanonisk Google tag `GT-MKRLF5WK` | Fyrer på `gtm.js`; `server_container_url=https://cloud.server.utekos.no`                                                                    |
| Tag `118` | GA4 event-tag                     | Fyrer for `page_view`, `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase`, `search`, `generate_lead` |
| Tag `126` | Cookiebot CMP-template            | Consent initialization                                                                                                                      |
| Tag `127` | Microsoft Clarity                 | Lastes gjennom web-GTM                                                                                                                      |
| Tag `130` | Microsoft UET base/page-load      | Fyrer fra web-GTM                                                                                                                           |
| Tag `131` | Microsoft UET event               | Fyrer for kanoniske events                                                                                                                  |

Google tag `109` har ingen eksplisitt `send_page_view=false`. Den
eksterne Google-tag-resource-konfigurasjonen har automatisk
pageview aktivert.

Den samme eksterne resource-konfigurasjonen har automatisk
innsamling av user-provided data aktivert for e-post, telefon og
adresse. Automatisk email-redaction er deaktivert. Dette ligger
ikke som en synlig variabel i web-containeren og ble derfor
oversett av en vanlig tag-/variabelinventering.

Web-containerens Google-, GA4- og Clarity-tags er publisert med
consent status `notNeeded`; UET-taggene er `notSet`. De globale
Consent Mode-signalene kan fortsatt påvirke vendor-taggen, men
taggene har ingen ekstra eksplisitt service-consent-gate i
containeren. Cookiebot lastes dessuten både av appen og tag
`126`, så CMP har to eiere.

### Server-container v22

| Type   | ID / navn                             | Rolle                                                                       |
| ------ | ------------------------------------- | --------------------------------------------------------------------------- |
| Client | `1`, GA4                              | Krever og parser GA4-hits; dependency serving er aktivt                     |
| Client | `6`, Google Tag Manager Web Container | Serverer tillatte `gtm.js`, `ns.html` og `gtag/js`-IDer                     |
| Client | `7`, Measurement Protocol             | Tar imot `/mp/collect`, men appen bruker den ikke                           |
| Client | `34`, Cookiebot consent signals       | Serverer/leser Cookiebot hjelpeflyt; hjelpe-scriptet er ikke lastet i appen |
| Tag    | `4`, GA4                              | Sender GA4-client-events til `G-FCES3L0M9M`                                 |
| Tag    | `11`, GA4 Measurement Protocol        | Sender MP-events unntatt purchase                                           |
| Tag    | `22`, GA4 MP purchase                 | Sender purchase-events                                                      |
| Tag    | `27`, Conversion Linker               | Google conversion-linking                                                   |

Server-containeren har **0 transformations**. GA4-taggene er
konfigurert med event parameters og user properties satt til
`all`, og blir dermed eksponert for full parsed event data. Det
finnes ingen transformation-basert allowlist, redaction eller
siste personverngate. Hvilke felter hver tag faktisk sender
outbound må bevises i Preview.

Tag `22` er navngitt som MP purchase, men live-triggeren krever
bare `_event=purchase`. Den mangler det tidligere client-filteret
`Client Name = Measurement Protocol GA4`. En browser-purchase fra
GA4-clienten kan derfor fyre både generell tag `4` og
purchase-tag `22`.

Server-versjon `20` og `21` overskrev tidligere den innebygde
GTM-clienten med Cookiebot-clienten. Det ga HTTP 400 for
loaderne. Versjon `22` gjenopprettet client `6` og flyttet
Cookiebot til client `34`. Client-ID-invarianten og loader-smoken
må bevares ved enhver publisering.

## Eventmatrise: nåværende produsenter og transport

| Event                                 | Browser → sGTM                                                      | Supabase → direkte GA4 MP             | Andre Google-spor                                                  | Nåværende avvik                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `page_view`                           | Ja, automatisk Google tag                                           | Ikke i nåværende lokale allowlist     | Manuell push fra både `GoogleAnalyticsPageTracker` og `PixelLogic` | Opptil tre samtidige produsenter; 40,3 % kandidatduplikater innen ett sekund i auditvinduet                         |
| `view_item_list`                      | Ja                                                                  | Ja når consent + client-ID            | –                                                                  | Ubetinget parallell sending                                                                                         |
| `select_item`                         | Ja                                                                  | Ja når consent + client-ID            | –                                                                  | Ubetinget parallell sending                                                                                         |
| `view_item`                           | Ja                                                                  | Ja når consent + client-ID            | –                                                                  | Ubetinget parallell sending                                                                                         |
| `add_to_cart`                         | Ja                                                                  | Ja når consent + client-ID            | `addCartLinesAction` sender i tillegg direkte MP                   | Kan bli trippelsendt                                                                                                |
| `begin_checkout`                      | Ja                                                                  | Ja når consent + client-ID            | –                                                                  | Ubetinget parallell sending                                                                                         |
| `purchase`                            | Ja for Klarna Express-return                                        | Nei for den aktive Klarna-produsenten | Shopify paid webhook sender separat direkte MP                     | Klarna-payload mangler value/currency/items; sGTM kan sende den to ganger, og transaction ID kan avvike fra webhook |
| `search`                              | Triggeren støtter eventet, men ingen aktiv app-produsent ble funnet | Ja hvis eventet en dag produseres     | –                                                                  | Kontrakten finnes uten datakilde; ingen event observert siste 30 dager                                              |
| `generate_lead`                       | Ja                                                                  | Ja når consent + client-ID            | Newsletter server-event kan også bruke MP                          | Flere potensielle produsenter                                                                                       |
| `scroll`, `form_start`, `form_submit` | Automatisk Google-tag-flyt                                          | Nei                                   | –                                                                  | Auto-UPD har festet rå e-post til enkelte hits                                                                      |
| Custom events                         | Normalt nei; faller utenfor tag `118` sin regex                     | Nei i nåværende lokale allowlist      | Supabase/Meta/Microsoft kan fortsatt motta dem                     | FLOW kan gi inntrykk av Google-dekning som ikke finnes                                                              |

Google retry-pathen opprettes i dag av
`getProvidersForAcceptedTrackingEvent` når
`shouldQueueGoogleServerEvent` matcher. `sendGA4BrowserEvent`
sender deretter direkte MP. Den spør aldri om sGTM-hiten feilet.
Navnet «fallback» er derfor misvisende.

## Consent-flyten

1. `CookieScript` setter Google og Microsoft defaults til denied
   før CMP.
2. Cookiebot lastes.
3. `CookiebotConsentProvider` oppdaterer Google Consent Mode v2,
   Microsoft consent og Clarity Consent API v2.
4. Web-GTM lastes etter page-settle uavhengig av React consent
   state.
5. Google-taggen bruker Consent Mode-signaler i
   measurement-requesten.
6. Appens eksplisitte commerce-events er service-gatet før
   `dataLayer`-push.

Dette er ikke det samme som at hele flyten er fail-closed.
Produksjonslogger har vist rå `ep.user_data.email` sammen med
flere Consent Mode-mønstre, inkludert `G100`/`npa=1` og
denied/default-lignende `gcd`. Automatisk user-provided data
collection må derfor anses som ukontrollert frem til den er
deaktivert og re-verifisert i Tag Assistant.

`uc-consent-signals.js` skriver en `cbAllowedCategories`-cookie
når det lastes, men det lastes ikke av nåværende app eller
publiserte web-container. Server client `34` gir derfor falsk
trygghet hvis health-responsen brukes som bevis på aktiv
Cookiebot→sGTM category-synk.

`GOOGLE_BROWSER_EVENT_TRANSPORT=sgtm` er heller ikke bryteren som
ruter browsertrafikken. Den reelle rutingen styres av Google tag
`109` sitt `server_container_url`. Env-verdien påvirker bare
appens server-dispatchlogikk.

## Read-only produksjonsbevis

### Endepunkter

`npm run tracking:sgtm-loaders:verify` var grønn
2026-07-12T07:53:15Z:

- `/healthy`: 200;
- `/uc-consent-signals.js`: 200;
- `/gtm.js?id=GTM-5TWMJQFP`: 200;
- `/ns.html?id=GTM-5TWMJQFP`: 200;
- tre godkjente `gtag/js`-loadere: 200.

Dette beviser tilgjengelighet og client-claiming, ikke korrekt
eventflyt.

### Cloud Run request logs

- 1 027 `/g/collect`-requests ble observert fra
  2026-07-10T22:00:00Z til 2026-07-12T07:51:31Z; alle svarte 200.
- I dette vinduet var minst 837 `page_view`, 66 `view_item`, 6
  `view_item_list`, 4 `add_to_cart`, 2 `begin_checkout` og 2
  `generate_lead`.
- 53 request-logger fra 2026-07-05T00:00:00Z til
  2026-07-12T07:51:31Z inneholdt query key `ep.user_data.email`;
  alle observerte verdier hadde rå e-postform og ingen hadde
  SHA-256-form. Verdiene ble ikke skrevet ut.
- Hendelsene omfattet `page_view`, `scroll`, `form_start`,
  `add_to_cart` og `begin_checkout`. 20 requests hadde
  `gcs=G100`/`npa=1`, mens 33 hadde `gcs=G111`/`npa=0`; flere
  hadde denied/default-mønster i `gcd`. Dette beviser rå e-post
  under ulike storage-/ad-personalization-signaler. Definitiv
  per-hit consenttolkning må gjøres i Tag Assistant fordi
  kodingen kan endres.

Auditvinduet inneholder én `test`-request som ble laget ved en
delegert kontrollfeil 2026-07-12T07:48:29Z. Se «Auditavvik»
under.

Cloud Logging dokumenterer request-URLen, men ikke POST body. PII
i en GET query blir derfor lagret i den automatiske
request-loggen.

### Cloud Run kapasitet og overvåking

- `gtm-server` har minimum instances unset, effektivt `0`;
- maximum instances er `5`, concurrency `80`, CPU/minne
  `1 vCPU / 512 MiB`;
- live revisjon er `gtm-server-00001-khb` med 100 % trafikk;
- auditvinduet hadde 0 HTTP 5xx;
- det auditerte Google Cloud-prosjektet hadde ingen observerte
  Cloud Monitoring alert policies eller uptime checks.

Siste 30 dager inneholdt 1 499 HTTP 400, dominert av den nå
rettede loader-client-hendelsen og bot/skannertrafikk. Derfor må
fremtidige varsler skille kanoniske loader-/collect-paths fra
forventet støy.

### Dokumentert pageview-duplisering

For `/g/collect` fra 2026-07-05T00:00:00Z til
2026-07-12T07:51:31Z ble pageviews gruppert på SHA-256 av
client-ID, session-ID og URL origin/path, deretter i tidsklynger:

- 3 284 pageview-requests hadde client, session og page-path
  tilgjengelig for anonymisert gruppering;
- innen konservative ett-sekundsklynger ble 1 322 hits
  klassifisert som kandidatduplikater;
- dette er 40,3 % av alle observerte pageview-requests i vinduet;
- 942 klynger hadde duplikater; enkelte klynger inneholdt seks
  treff.

Rå ID-er og URLer ble aldri skrevet ut; grupperingsnøkkelen ble
SHA-256-hashet.

### Supabase og GA4

- Supabase har 0 `client_observed`-rader og ingen
  sGTM-/domenepeker i `marketing.event_ledger`,
  `ops.provider_dispatch_attempts`, provider responses eller dead
  letters.
- All-time-snapshot 2026-07-12T07:54:53Z viste 2 065 Google
  `succeeded`-rader i `dispatch_mode='server_retry'` i den aktive
  rapporten. Disse representerer direkte MP, ikke sGTM-bevis.
- Den samme direkte Google-pathen har 48 uløste dead letters fra
  `page_location`-validering. De sier ingenting om sGTM-status.
- De 22 observerte `server_direct`-audit-radene har tom payload,
  consent basis, data quality og provider response. De beviser
  intern jobbstatus, ikke full providerleveranse.
- For perioden 2026-07-11–2026-07-12 i `Europe/Oslo` viste
  kontrollen 66 sGTM `view_item` og 87 direkte MP `ViewContent`;
  GA4 Data API viste 153 `view_item`, nøyaktig summen. Cloud- og
  Supabase-filteret startet 2026-07-10T22:00:00Z og sluttet ved
  auditkjøringen.
- BigQuery 2026-07-09 viste at business-events med `event_id`
  typisk fikk en ny hit uten `event_id` for samme bruker/event
  2–5 minutter fra hverandre, i tråd med Supabase-køens planlagte
  retry-delay.
- GA4 har ingen custom dimensions eller custom metrics.
  `event_id` er derfor heller ikke en rapporterbar custom
  dimension.

### GA4 eventdekning siste 30 dager

| Event            | Event count | Total users |
| ---------------- | ----------: | ----------: |
| `page_view`      |      10 041 |       1 330 |
| `view_item`      |       1 585 |         337 |
| `add_to_cart`    |         202 |          77 |
| `begin_checkout` |          58 |          44 |
| `purchase`       |          36 |          19 |
| `view_item_list` |         107 |          78 |
| `select_item`    |          40 |          18 |
| `generate_lead`  |           4 |           3 |

Ingen `search`, `view_cart`, `remove_from_cart`,
`add_shipping_info`, `add_payment_info` eller `refund` ble
observert i rapporten. Noen steg i checkout skjer hos Shopify og
krever en eksplisitt, dokumentert integrasjon mot checkout eller
server dersom de skal måles.

## Gapregister

| Prioritet | Gap                                                                                                       | Konsekvens                                                                                               | Lukkekriterium                                                                                                    |
| --------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| P0        | Automatisk UPD sender rå e-post i `/g/collect` og Cloud Logging                                           | Personvern-, policy- og incident-risk; også observert med `G100`/`npa=1` og denied/default-`gcd`-mønster | Auto-UPD av, email redaction på, ingen rå email i granted/denied smoke, retention/deletion besluttet av ansvarlig |
| P0        | Tre `page_view`-produsenter                                                                               | Oppblåste sesjoner/pageviews og feil beslutningsgrunnlag                                                 | Én eier; ingen mer enn én GA4 pageview per logisk navigation                                                      |
| P0        | Browser commerce via både sGTM og direkte MP                                                              | Dobbelttelling i GA4 og Ads-importer                                                                     | Browser-events har én transport; direkte MP brukes bare for særskilt server-event                                 |
| P0        | `add_to_cart` har en tredje direkte MP-produsent uten eksplisitt consent-gate, `event_id` eller audit     | Oppblåst funnel, svakt samtykkebevis og ingen korrelasjon                                                | Server action sender ikke samme event som browser-path; valgt eier har consent, event-ID og audit                 |
| P0        | Microsoft UET finnes både i web-GTM og appkode                                                            | Doble UET page loads/events                                                                              | Velg én UET-eier og fjern den andre                                                                               |
| P0        | Purchase har browser-return og paid webhook uten ett felles eierskapskontrakt                             | Feil kjøpsverdi/antall; ulik transaction ID kan omgå GA-dedupe                                           | Paid webhook eier purchase; identisk, unik transaction ID og ett dispatch-spor                                    |
| P0        | Server-tag `22` matcher alle purchase-events, ikke bare MP-clienten                                       | En browser-purchase kan fyre både tag `4` og tag `22` inne i sGTM                                        | Gjeninnfør `Client Name = Measurement Protocol GA4` på purchase-triggeren og bevis én outbound hit                |
| P0        | Klarna browser-purchase mangler `value`, `currency` og `items`                                            | To mulige, ufullstendige sGTM purchase-hits kan forurense revenue/ecommerce                              | Paid webhook eier full purchase; Klarna-return blir en ikke-konverterende bekreftelsesvisning                     |
| P1        | Cookiebot lastes av både app og web-GTM                                                                   | Overlappende CMP-eierskap og driftssårbar consent initialization                                         | Velg én CMP-eier; verifiser standard, accept, decline og withdraw                                                 |
| P1        | Clarity har `consentStatus=notNeeded` og første app-update kan skje før `window.clarity` finnes           | Første consent state kan gå tapt eller være implisitt                                                    | Eksplisitt consent gate/sekvensering i én eier og nettverksbevis                                                  |
| P1        | 0 server transformations                                                                                  | Ingen siste allowlist/redaction før provider                                                             | Eksplisitt exclude/allow transformation testet i Preview for alle server-tags                                     |
| P1        | sGTM mangler `event_id` i observerte hits                                                                 | Ingen transportkorrelasjon; ingen sikker dedupe                                                          | Web-eventtag map-er `event_id`; BigQuery/Preview viser samme ID end-to-end                                        |
| P1        | sGTM er usynlig i Supabase audit                                                                          | «succeeded» kan ikke knyttes til faktisk sGTM/provider-delivery                                          | `client_observed` eller separat receipt-status med ærlig semantikk; aldri kall browser-push provider-succeeded    |
| P1        | `server_direct`-audit mangler payload, consent basis og provider response                                 | Server-purchase kan ikke etterprøves end-to-end                                                          | Lagre minimert input, consent provenance, transport og faktisk HTTP/providerresultat                              |
| P1        | Checkout-ID-capture er gatet på generell marketing, ikke provider-spesifikk Google statistics             | Google client/session kan mangle ved statistics-only; consentgrunnlag uklart                             | Provider-spesifikk capture/provenance og forbud mot bruk uten riktig service-consent                              |
| P1        | `/uc-consent-signals.js` og client `34` er ikke operativt koblet                                          | Health-check gir falsk trygghet                                                                          | Enten implementer dokumentert bruk og test cookie/signaler, eller fjern endpoint/client fra akseptkriteriet       |
| P1        | MP-client `/mp/collect` finnes uten eier                                                                  | Dobbelt arkitektur og ulik policyhåndheving                                                              | Beslutning dokumentert: bruk for bestemte server-events eller fjern/deaktiver                                     |
| P1        | Direkte MP behandler HTTP 2xx som suksess; validering er valgfri, og enkelte kopier kan mangle session ID | 2xx beviser mottak, ikke behandling; svak Realtime-/sesjonsattribusjon                                   | `ENFORCE_RECOMMENDATIONS` i kontrollflyt, krev session ID der use case krever det, og lagre ærlig providerstatus  |
| P1        | Ingen verifisert minimum instances                                                                        | Cold start/kapasitets- og tilgjengelighetsrisiko                                                         | Cloud Run min instances settes iht. volum; Google anbefaler minst 3 per container                                 |
| P1        | Ingen observerte Cloud Monitoring alert policies                                                          | Loader-/trafikkbrudd oppdages manuelt                                                                    | Alerts for 400/5xx, request-drop, latency, CPU/instances og kost                                                  |
| P1        | Smoke tester loaderstatus, ikke eventkorrekthet                                                           | Grønne tester overser PII og duplikater                                                                  | Deterministisk Preview/QA-smoke for consent, event count, param allowlist og transport owner                      |
| P1        | Stale dokumentasjon om live versjoner                                                                     | Feil operasjonelle beslutninger og rollback                                                              | Versjon 107/22 og rollback-eier dokumentert fra live API/resource                                                 |
| P1        | Manglende funnel-events                                                                                   | Ufullstendig checkout- og returinnsikt                                                                   | Eierskap/implementasjon for relevante events, eller eksplisitt «ikke tilgjengelig»                                |
| P1        | Newsletter-serverevent lager tilfeldig GA client ID uten eksplisitt consent/audit                         | Kunstig brukeridentitet og ikke-etterprøvbar serverevent                                                 | Route gjennom consent-gatet ledger med ekte client/session, ellers skip med grunn                                 |
| P2        | Ingen CSP i appen                                                                                         | Mangler security hardening; fremtidig CSP kan bryte sGTM transport                                       | Innfør testet CSP med `cloud.server.utekos.no` i `img-src`, `connect-src` og `frame-src`                          |
| P2        | Førsteparts-subdomene, ikke same-origin/CDN                                                               | Noe potensial for cookie-/cache-/latensforbedring er ubrukt                                              | Egen beslutning og måling; ingen migrering før P0/P1 er lukket                                                    |
| P2        | Google sin oppdaterte dependency-serving-guide anbefaler CDN, mens tagging-serveren brukes direkte        | Mulig uutnyttet cache-, latency- og kostoptimalisering                                                   | Mål dagens løsning og vurder CDN først etter correctness/privacy; behold verifisert rollback                      |
| P2        | Ubrukte custom templates, triggere og secret-cookie-variabel er publisert                                 | Unødvendig supply-chain- og feilflate                                                                    | Snapshot/rollback først, deretter fjern alt uten aktiv tag/eier                                                   |

## Obligatorisk rettingsrekkefølge

Alle punktene under innebærer produksjons-, GTM-, Google-tag-,
Cloud Logging- eller deploymutasjoner og krever eksplisitt
operatørgodkjenning etter [DEPLOYMENT.md](../../DEPLOYMENT.md).

### 0. Begrens personvernavviket

1. Slå av automatisk user-provided data collection i Google
   tag/GA4 og sett automatisk email-redaction til på.
2. Fjern ugyldige/tomme selector-exclusions; ikke reaktiver
   auto-collection.
3. Bruk Preview til å identifisere feltene som faktisk parses fra
   `ep.user_data.email` og tilsvarende telefon-/adresseinput.
   Legg deretter en server transformation som ekskluderer disse
   fra alle server-tags inntil en eksplisitt, consent-gatet og
   hashet UPD-design er godkjent.
4. Verifiser både denied og granted state uten å bruke en reell
   e-postadresse.
5. Behandle eksisterende Cloud Run request logs som et privacy
   incident. Avklar tilgang, retention og eventuell sletting med
   ansvarlig. Cloud Logging sin log-delete er
   log-stream-omfattende, ikke en ufarlig enkeltpostoperasjon.

Kildestopp er primærrettingen. En sGTM transformation alene skjer
etter at request-URLen allerede har nådd og blitt logget av Cloud
Run.

### 1. Etabler én produsent og én transport per event

1. Sett `send_page_view=false` på Google tag hvis manuell SPA
   pageview skal beholdes.
2. Behold én pageview-produsent. `GoogleAnalyticsPageTracker` og
   `PixelLogic → dispatchMetaTrackingEvent` skal ikke begge pushe
   Google `page_view`.
3. La browser commerce-events bruke sGTM som eneste
   Google-transport. Fjern ubetinget Google queueing for disse
   eventene.
4. Hvis en fallback virkelig kreves, må den utløses av et
   verifisert manglende receipt/timeout og være idempotent. Et
   to-minutters cron-retry er ikke bevis på sGTM-feil.
5. Fjern den separate `addCartLinesAction`-MP-hiten for samme
   brukerhandling, eller gjør den til eneste eier og fjern
   browser-hiten.
6. La Shopify paid webhook være kanonisk `purchase`-produsent.
   Klarna-return kan måles som en ikke-konverterende
   bekreftelsesvisning.
7. Gjeninnfør MP-clientfilteret på sGTM purchase-triggeren før
   noen kontroll av browser-purchase.
8. Velg én Microsoft UET browser-eier. Den versjonskontrollerte
   appflyten har i dag mer eksplisitt consent/event-ID; hvis den
   beholdes, fjernes UET tag `130` og `131` fra web-GTM.
9. Velg én Cookiebot-eier; app og web-container skal ikke begge
   laste CMP.

### 2. Gjør sGTM til en kontrollflate, ikke bare proxy

1. Opprett transformations for allowlist, redaction og
   blokkering.
2. Map `event_id` eksplisitt fra dataLayer til GA4 event
   parameters og videre gjennom sGTM.
3. Dokumenter hvert server-tag sitt tillatte event- og
   parameterkontrakt.
4. Registrer `client_observed` når browser-dispatch er observert,
   og skill det fra sGTM ingress, tag execution og provider
   response. Registrer bare status som den dokumenterte
   mekanismen faktisk kan observere; kall aldri intensjon
   provider-succeeded.
5. Velg om `/mp/collect` skal eie et avgrenset sett
   server-events. Ikke send samme event både direkte og via
   server-containeren.
6. Behold Supabase som kanonisk ledger/retry. En eventuell
   migrering av Meta/Microsoft til sGTM må bevare event-ID,
   consent, provider response og audit.
7. Route newsletter-serverevents gjennom samme consent-,
   identitets- og auditkontrakt; aldri generer en tilfeldig GA
   client-ID som fallback.

### 3. Produksjonshardening

1. Sett og verifiser minimum instances. Google anbefaler minst
   tre for live redundans; nå er min unset og max `5`.
2. Opprett alerts for request-volumfall, 400, 5xx, latency, CPU,
   instance saturation og kost.
3. Utvid `tracking:sgtm-loaders:verify` og commerce doctor med
   containerinvariant, aktiv versjon og funksjonell
   Preview/QA-smoke.
4. Legg en testet CSP som tillater sGTM sine støttede
   transportmetoder.
5. Evaluer CDN/same-origin først etter at correctness og privacy
   er grønt.

### 4. Fullfør eventdekning

Ta en eksplisitt beslutning for `view_cart`, `remove_from_cart`,
`add_shipping_info`, `add_payment_info`, `refund` og `search`.
Shopify-hostede checkout-steg skal ikke «simuleres» fra frontend;
de må komme fra en dokumentert checkout-/webhook-kilde eller
markeres utilgjengelige.

## Lukkekriterier

Arbeidet er ikke ferdig før alle disse kan bevises:

- Ingen rå e-post/telefon/adresse i browser request URL, Cloud
  Run logs, sGTM Preview eller GA4 payload.
- Denied state sender ingen user-provided data.
- Én logisk page navigation gir nøyaktig én GA4 `page_view`.
- Hver commerce-handling gir nøyaktig én GA4 business-event, med
  ett dokumentert transport-owner-felt i audit.
- `event_id` følger browser-eventet til sGTM/BigQuery;
  `transaction_id` er identisk og unik for purchase.
- Microsoft UET fyrer én page load og én business-event per
  handling.
- Supabase skiller `client_observed`, `server_direct` og
  `server_retry` uten å fremstille intensjon som
  provider-suksess.
- Server-containeren har testede transformations.
- Cloud Run har verifisert kapasitet og aktive varsler.
- GTM Preview, browser network, Cloud Run metrics/logs, Supabase
  og GA4/Ads viser samme forventede kontrollhendelse uten PII
  eller duplikat.

## Verifikasjonskommandoer

Disse er read-only eller lokale med mindre de kombineres med
publish/deploy:

```bash
npm run tracking:sgtm-loaders:verify
npm run mcp:build
npm run mcp:doctor
npm run mcp:commerce-tracking:doctor
npm run ops:provider-dispatch-report -- --json
npm run ops:identifier-coverage-report -- --json
npm run ops:ga4-bigquery-readiness
pnpm exec tsc --noEmit
```

Produksjons-smoke skal bruke GTM Preview/Tag Assistant, en
ikke-identifiserende testverdi og eksplisitt godkjenning. En
vanlig GET til `/g/collect` er ikke en ufarlig health-check; den
kan opprette et analytics-event.

## Auditavvik 2026-07-12

Under delegert read-only-kartlegging ble det ved en feil sendt én
syntetisk GET til produksjonens collection-endepunkt:

```text
/g/collect?v=2&tid=G-FCES3L0M9M&cid=555&en=test
```

Tid: 2026-07-12T07:48:29Z. Requesten svarte 200 og er synlig som
én `test` i Cloud Run-requestloggen. Den kan ha opprettet ett
syntetisk GA4-event. GA4 Data API viste ingen prosessert `test`
på kontrolltidspunktet, men det er ikke et sikkert bevis på at
eventet aldri blir behandlet. Ingen flere collection-requests ble
sendt, og ingen konfigurasjon ble endret.

## Kodeflater som eier flyten

- `src/components/layout/CookieScript.tsx`
- `src/components/cookie-consent/CookiebotConsentProvider.tsx`
- `src/components/analytics/GoogleTagManagerScript.tsx`
- `src/components/analytics/GoogleAnalyticsPageTracker.tsx`
- `src/components/analytics/Meta/PixelLogic.tsx`
- `src/lib/tracking/google/pushGoogleDataLayerEvent.ts`
- `src/lib/tracking/meta/dispatchMetaTrackingEvent.ts`
- `src/app/api/tracking-events/route.ts`
- `src/lib/tracking/warehouse/getProvidersForAcceptedTrackingEvent.ts`
- `src/lib/tracking/google/shouldQueueGoogleServerEvent.ts`
- `src/lib/tracking/google/sendGA4BrowserEvent.ts`
- `src/lib/tracking/server/sendGA4Events.ts`
- `src/lib/actions/addCartLinesAction.ts`
- `src/lib/tracking/services/processOrderTrackingWithDependencies.ts`
- `src/lib/tracking/google/handlePurchaseEvents.ts`
- `src/components/analytics/MicrosoftUetTag.tsx`

## Offisielle kilder

- [Google: server-side tagging overview](https://developers.google.com/tag-platform/tag-manager/server-side/overview)
- [Google: send data to a server container](https://developers.google.com/tag-platform/tag-manager/server-side/send-data)
- [Google: server-side consent mode](https://developers.google.com/tag-platform/tag-manager/server-side/consent-mode)
- [Google: control event parameters with transformations](https://developers.google.com/tag-platform/tag-manager/server-side/transformations)
- [Google: first-party dependency serving](https://developers.google.com/tag-platform/tag-manager/server-side/dependency-serving)
- [Google: monitor server-side tagging infrastructure](https://developers.google.com/tag-platform/learn/sst-fundamentals/9-sst-monitoring)
- [Google: GTM template Monitoring API](https://developers.google.com/tag-platform/tag-manager/templates/monitoring)
- [Google Analytics: user-provided data collection](https://support.google.com/analytics/answer/14077171)
- [Google Analytics: collect user-provided data with GTM](https://support.google.com/analytics/answer/14171268)
- [Google Analytics: avoid sending PII](https://support.google.com/analytics/answer/6366371)
- [Google Analytics: Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Google Analytics: Measurement Protocol reference](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference)
- [Google Analytics: purchase dedupe with transaction ID](https://support.google.com/analytics/answer/12313109)
- [Google Cloud: platform/request logs](https://docs.cloud.google.com/logging/docs/api/platform-logs)
- [Google Cloud: log storage and retention](https://docs.cloud.google.com/logging/docs/store-log-entries)
- [Supabase: Queues](https://supabase.com/docs/guides/queues)
- [Supabase: Cron](https://supabase.com/docs/guides/cron)

Se [WHY.md](WHY.md) for beslutningsprinsippene: hva sGTM skal
eie, hva som skal forbli i Supabase, og hvorfor «send alt via
server» ikke i seg selv er en best practice.

## Auditproveniens og blokkerte kontroller

- Live web-/server-inventar ble lest gjennom Stape sin
  autentiserte `google-tag-manager-mcp-server` på
  `https://gtm-mcp.stape.ai/mcp`.
- Stape-verktøyene for live version, version headers,
  workspace/status og container fungerte read-only. Én
  midlertidig GTM API 429 ble håndtert uten write/publish.
- Den eksterne Google-tag-konfigurasjonen ble lest fra den
  offentlig serverte kompilerte ressursen uten å kjøre den.
- Cloud Run-konfigurasjon/logger ble lest med `gcloud`; Supabase
  kun med `SELECT`; GA4 med Google Analytics MCP/Data API og
  BigQuery read-only.
- Developer Knowledge Google MCP krevde reautentisering.
  Oppdaterte offisielle Google-nettsider og den lokale
  dokumentasjonsmirrorn ble brukt som fallback.
- Ingen GTM Preview/Tag Assistant-session ble opprettet, og
  outbound hashing til GA4/Ads er derfor ikke bevist.
- Ingen GTM-publisering, provider-write, deploy, env-endring,
  sletting i Cloud Logging eller Supabase-mutasjon ble utført.
