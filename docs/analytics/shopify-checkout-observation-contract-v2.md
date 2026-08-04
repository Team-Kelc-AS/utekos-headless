# Shopify checkout-observasjon v2

Statusdato: 2026-08-04

Den normative kontrakten er
`contracts/shopify/checkout-observation/v2/schema.json` med SHA-256
`28a0c7862114959189c2955ae3d15fad7a7ecd5f44e8fe06f785c45a0e985bd6`.
Den samme filen skal være byte-identisk i `utekos-headless` og
`utekos-shopify-platform-app`.

## Semantikk og eierskap

V2 gjelder bare Shopify `payment_info_submitted`. Shopify beskriver dette som
at kunden sender inn betalingsinformasjon, og Google anbefaler
`add_payment_info` når en bruker sender inn betalingsinformasjon. Hendelsen er
derfor en innsending, ikke bevis på validering, autorisasjon, betaling eller
Purchase.

`purchase`-eierskapet endres ikke. Den eksisterende Shopify
order-payment-flyten er fortsatt eneste canonical Purchase-eier.

Kilder:

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
3. v2 `payment_info_submitted` etter cutover-tidspunktet;
4. analytics-samtykke i både observasjonen og korrelert `begin_checkout`;
5. samme production-miljø, valuta og total vareantall;
6. korrelert `begin_checkout` er 0–24 timer eldre.

Google-levering krever i tillegg en gyldig Google client ID fra den
korrelerte ledger-raden. Uten den beholdes canonical event, men Google-raden
klassifiseres `skipped_unqualified` med `missing_client_id`.

Canonical payload henter commerce/items og Google browser-ID fra den
eksisterende ledger-raden. Web Pixel-payloaden kan derfor ikke injisere
providerdata. Marketing settes eksplisitt til denied, og Meta-/Microsoft-/
PostHog-identifikatorer kopieres ikke.

Den deterministiske canonical UUID-en avledes av Shopify source-event-ID-en.
Ledger og outbox beholder dermed samme idempotensnøkler på retry. Hvis
observasjonen er lagret, men canonical lookup midlertidig feiler, svarer
mottakeren 503; Web Pixel prøver én gang til med identisk payload.

## Provider- og cutover-policy

Kun `google:add_payment_info` er aktiv server-outbox. Meta, Microsoft UET og
PostHog er deaktivert/ikke relevante for denne hendelsen.

Produksjonsrekkefølgen er:

1. deploy mottaker og storefront-korrelasjon mens canonical-porten er av;
2. deploy Web Pixel v2;
3. fjern bare `payment_info_submitted` fra Custom Pixel-en
   `Utekos GA4 Commerce`; behold `checkout_completed`/`purchase` uendret;
4. sett cutover-tidspunkt til etter den gamle eieren ble stoppet;
5. aktiver canonical-porten og redeploy samme verifiserte headless-artefakt;
6. verifiser første naturlige event gjennom observation, ledger, Google
   outbox og Google providerstatus.

Ingen syntetisk produksjonsbetaling eller ordre skal opprettes for testen.
