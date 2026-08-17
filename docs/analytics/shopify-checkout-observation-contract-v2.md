# Shopify checkout-observasjon v2

Statusdato: 2026-08-17

Den normative kontrakten er
`contracts/shopify/checkout-observation/v2/schema.json` med SHA-256
`5ffcbb326c17fd5ff02425be5b028b9ac7c03c5cef127ddce8296afe52f8ed3d`.
Den samme filen skal være byte-identisk i `utekos-headless` og
`utekos-shopify-platform-app`.

## Semantikk og eierskap

V2 gjelder Shopify `checkout_shipping_info_submitted` og
`payment_info_submitted`. Den første betyr at kunden har valgt en fraktrate.
Den andre betyr at kunden har sendt inn betalingsinformasjon, ikke at
betalingen er validert, autorisert eller fullført.

`purchase`-eierskapet endres ikke. Den eksisterende Shopify
order-payment-flyten er fortsatt eneste canonical Purchase-eier.

Kilder:

- [Shopify `checkout_shipping_info_submitted`](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_shipping_info_submitted)
- [Shopify `payment_info_submitted`](https://shopify.dev/docs/api/web-pixels-api/standard-events/payment_info_submitted)
- [Shopify Pixel privacy](https://shopify.dev/docs/api/web-pixels-api/pixel-privacy)
- [Google GA4 `add_payment_info`](https://developers.google.com/analytics/devguides/collection/ga4/reference/events#add_payment_info)
- [Google Data Manager recommended events](https://developers.google.com/data-manager/api/reference/analytics/recommended-events)
- [Google Data Manager send events](https://developers.google.com/data-manager/api/devguides/events/send-events)

## Streng grense

V2 beholder v1-kravene til streng validering, samtykkesnapshot,
idempotens/replay-konflikt, 16 KiB-grense og eksplisitt PII-forbud. Det eneste
nye feltet er:

```json
{
  "correlation": {
    "beginCheckoutEventId": "canonical UUID"
  }
}
```

Web Pixel leser bare den allowlistede checkout-attributten
`utekos_begin_checkout_event_id`. Den sender ikke items, navn, e-post,
telefon, adresser, fritekst, betalingsdetaljer, URL-er, click-ID-er,
provider-ID-er eller andre checkout-attributter.

Hvis UUID-en mangler eller er ugyldig, sendes hendelsen fortsatt som v1
`observed` og kan ikke promoteres. V1 for alle fire observasjonskategorier er
alltid adskilt fra canonical ledger og provider-outbox.

## Canonical promotering

Promotering er fail-closed og krever samtidig:

1. `SHOPIFY_ADD_PAYMENT_INFO_CANONICAL_ENABLED=true`;
2. gyldig `SHOPIFY_ADD_PAYMENT_INFO_CUTOVER_AT`;
3. en korrelert v2 checkout-progress-hendelse etter cutover-tidspunktet;
4. analytics-samtykke i både observasjonen og korrelert `begin_checkout`;
5. samme production-miljø, valuta og total vareantall;
6. korrelert `begin_checkout` er 0–24 timer eldre.

Google-levering krever i tillegg en gyldig Google client ID fra den
korrelerte ledger-raden. Uten den beholdes canonical event, men Google-raden
klassifiseres `skipped_unqualified` med `missing_client_id`.

Canonical payload henter commerce, items og identitet fra den eksisterende
ledger-raden. Web Pixel-payloaden kan derfor ikke injisere providerdata. Meta-
identitet kopieres bare når både den korrelerte `begin_checkout`-hendelsen og
Shopify-snapshotet har marketing-samtykke. Ellers beholdes bare Google-
identifikatorene som er tillatt av analytics-samtykket.

Den deterministiske canonical UUID-en avledes av Shopify source-event-ID-en.
Ledger og outbox beholder dermed samme idempotensnøkler på retry. Hvis
observasjonen er lagret, men canonical lookup midlertidig feiler, svarer
mottakeren 503; Web Pixel prøver én gang til med identisk payload.

## Provider- og cutover-policy

`google:add_payment_info` forblir aktiv. `meta:add_shipping_info` og
`meta:add_payment_info` er aktive bare for marketing-samtykkede hendelser.
Google `add_shipping_info`, Microsoft UET, Pinterest og PostHog er ikke
aktivert av denne cutoveren.

Produksjonsrekkefølgen er:

1. deploy mottaker og storefront-korrelasjon mens canonical-porten er av;
2. deploy Web Pixel v2;
3. behold `checkout_completed`/`purchase` i Custom Pixel-en uendret;
4. behold det eksisterende cutover-tidspunktet og canonical-porten;
5. deploy samme verifiserte headless-artefakt;
6. verifiser første naturlige event gjennom observation, ledger, relevant
   provider-outbox og endelig providerstatus hos Google eller Meta.

Ingen syntetisk produksjonsbetaling eller ordre skal opprettes for testen.
