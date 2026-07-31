# KRI-24 — Shopify checkout-step source decision

Statusdato: 2026-07-31

## Beslutning

| Canonical event     | Shopify-kandidat                   | Resultat         | Kort begrunnelse                                                                       |
| ------------------- | ---------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `add_shipping_info` | `checkout_shipping_info_submitted` | `blocked_source` | Shopify dokumenterer valg av fraktrate, men ikke en stabil lagret fraktrevisjon.       |
| `add_payment_info`  | `payment_info_submitted`           | `blocked_source` | Shopify dokumenterer innsending, men ikke validering eller et akseptert betalingssteg. |

Ingen event er aktivert. Ingen App Pixel, Custom Pixel,
Shopify-appversjon, GTM/sGTM-konfigurasjon, provider, database,
miljøvariabel eller produksjonsdata er mutert.

## Kontrollerte offisielle kilder

- [Shopify `checkout_shipping_info_submitted`](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_shipping_info_submitted)
- [Shopify `payment_info_submitted`](https://shopify.dev/docs/api/web-pixels-api/standard-events/payment_info_submitted)
- [Shopify Web Pixels API overview](https://shopify.dev/docs/api/web-pixels-api)
- [Shopify pixels overview](https://shopify.dev/docs/apps/build/marketing/pixels)
- [Build a web pixel](https://shopify.dev/docs/apps/build/marketing/build-web-pixels)
- [Web pixel privacy settings](https://shopify.dev/docs/apps/build/marketing/pixels#requesting-consent)
- [Shopify checkout token](https://shopify.dev/docs/api/web-pixels-api/standard-api/checkout)

Context7 ble brukt som sekundær dokumentasjonsindeks mot
`/websites/shopify_dev`. Beslutningen bygger på Shopify-kildene
over.

## Kandidat 1: `checkout_shipping_info_submitted`

Shopify beskriver kilden som eventet som logges når kunden velger
en fraktrate. Eventet er bare tilgjengelig med Checkout
Extensibility.

Relevant dokumentert payload:

- standard event-envelope med `id`, `name`, `seq`, `timestamp` og
  `clientId`;
- `event.data.checkout`, inkludert checkout `token`;
- valgt `shippingLine` når den finnes;
- `delivery.selectedDeliveryOptions`, med blant annet `handle`,
  `title`, `cost` og type som kan være `shipping`, `pickup`,
  `pickupPoint` eller `local`.

Dette er et semantisk sterkere signal enn sidevisning, URL,
DOM-klikk eller antatt checkout-steg, men det oppfyller fortsatt
ikke Utekos-kontrakten:

- Shopify sier «chooses a shipping rate», ikke at valget er
  lagret som en autoritativ revisjon;
- payloaden har ingen dokumentert `shipping_revision`;
- `seq` er sekvens i pikselstrømmen, ikke en lagringsrevisjon;
- dokumentasjonen definerer ikke hvordan gjentatte valg skal
  kobles til en stabil, lagret revisjon;
- typene for delivery options dokumenterer representasjonen, men
  ikke at alle checkoutvarianter utløser eventet med identisk
  postcondition.

Kandidaten avvises derfor for canonical `add_shipping_info`.

## Kandidat 2: `payment_info_submitted`

Shopify beskriver kilden som eventet for at kunden sender inn
betalingsinformasjon. Eventet er tilgjengelig på checkout-siden.

Relevant dokumentert payload:

- standard event-envelope med `id`, `name`, `seq`, `timestamp` og
  `clientId`;
- `event.data.checkout`, inkludert checkout `token`;
- checkoutens `transactions` når de er tilgjengelige;
- betalingsmetodetyper som blant annet kan være `creditCard`,
  `redeemable`, `deferred`, `local`, `manualPayment`,
  `paymentOnDelivery`, `wallet`, `offsite`, `customOnSite` og
  `other`.

Dette beviser ikke Utekos sin nødvendige postcondition:

- «submitted» sier ikke om validering er fullført;
- det sier ikke at betalingssteget er akseptert;
- det sier ikke at en transaksjon er autorisert eller godkjent;
- det sier ikke at checkout er vellykket eller at betalingsfeil
  mangler;
- Shopify opplyser at enkelte transaksjoner først kan finnes ved
  `checkout_completed`;
- payloaden har ingen dokumentert `payment_revision`.

Gatewaynavn, `transactions`, betalingsmetodetype, URL,
sidevisning eller knappetrykk kan derfor ikke brukes som
erstatning. Kandidaten avvises for canonical `add_payment_info`.

## Source contracts og fail-closed-grense

| Felt                    | `add_shipping_info`                                                   | `add_payment_info`                                                                        |
| ----------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Canonical eier          | `shopify_checkout_event_source`                                       | `shopify_checkout_event_source`                                                           |
| Undersøkt Shopify-kilde | `checkout_shipping_info_submitted`                                    | `payment_info_submitted`                                                                  |
| Nødvendig postcondition | Bekreftet lagret fraktrevisjon                                        | Bekreftet akseptert betalingsrevisjon                                                     |
| Obligatorisk identitet  | checkout-token + stabil shipping-revisjon                             | checkout-token + stabil payment-revisjon                                                  |
| Source event-identitet  | Shopify `event.id`                                                    | Shopify `event.id`                                                                        |
| Sequencing              | `seq` kan lagres som diagnostisk metadata, aldri som revisjon         | `seq` kan lagres som diagnostisk metadata, aldri som revisjon                             |
| Dedupe                  | `checkout_id + shipping_revision`                                     | `checkout_id + payment_revision`                                                          |
| Repeat                  | Ny canonical ID bare ved ny autoritativ lagret revisjon               | Ny canonical ID bare ved ny autoritativ akseptert revisjon                                |
| Consent                 | C3, etter autoritativ mutasjon og provider-spesifikt samtykke         | C3, etter autoritativ mutasjon og provider-spesifikt samtykke                             |
| Retention               | R90, bare minimal dedupe key                                          | R90, bare minimal dedupe key                                                              |
| PII                     | Ikke lagre navn, e-post, telefon, adresse eller full checkout-payload | Ikke lagre navn, e-post, telefon, adresse, gatewaydetaljer eller full transaction-payload |
| Fail-closed             | Ingen innsamling, schema, ledger, dataLayer eller dispatch            | Ingen innsamling, schema, ledger, dataLayer eller dispatch                                |

Shopify kan levere registrerte pikselsignaler etter at samtykke
blir gitt. `timestamp` og `seq` må derfor beskrive kildeeventet;
mottakstid eller callback- rekkefølge kan ikke brukes som
revisjonsbevis.

## Produksjonsbevis

Read-only kontroll ga følgende:

- Repoet inneholdt en historisk Custom Pixel-artefakt som
  abonnerte på `payment_info_submitted` og sendte
  `add_payment_info`. Dette er en implementasjonspåstand, ikke
  bevis på gjeldende Shopify-konfigurasjon eller korrekt
  semantikk. Abonnementet er fjernet fra repoartefakten.
- Shopify Admin GraphQL-tilkoblingen returnerte `webPixel: null`
  med eksplisitt mangel på `read_pixels`, og
  appinstallasjonslisten var ikke lesbar med dagens scope.
- Ingen tilgjengelig nettleserøkt var autentisert i Shopify
  Admin.
- GA4 Data API returnerte null rader for både `add_shipping_info`
  og `add_payment_info` i perioden 2026-07-24–2026-07-31.
- Det ble ikke generert checkoutaktivitet, testordre eller
  syntetiske kundedata.

Produksjonsverifikasjonen er derfor blokkert. Det er ikke bevist
om Checkout Extensibility er aktiv for `kasse.utekos.no`, hvilken
app/piksel som eier Customer Events, om kildeeventene observeres,
eller hvordan gjentatte revisjoner og consent faktisk oppfører
seg i Utekos-checkouten.

## Separat oppfølgingsoppgave

En senere oppgave må:

1. få autentisert, read-only tilgang til Shopify Admin Customer
   Events og Checkout Extensibility-status;
2. identifisere eksisterende piksel/app-eier uten å opprette en
   duplikat;
3. sammenligne publisert pikselkode med repoartefakten;
4. observere en separat godkjent, ekte checkout-reise uten å
   lagre PII;
5. dokumentere source `id`, checkout-token, `seq`, `timestamp`,
   consent og gjentatte valg;
6. publisere eventuell fail-closed pikselendring bare etter
   eksplisitt Shopify-godkjenning.

Inntil dette er bevist, forblir begge hendelser `blocked_source`.
