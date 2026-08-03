# Shopify checkout-observasjon — kontrakt v1

Status: normativ kontrakt. Dette dokumentet og
`contracts/shopify/checkout-observation/v1/schema.json` eies av
`utekos-headless`. Shopify-appen bruker en byte-identisk,
kontrollert kopi av JSON-skjemaet.

## Formål og evidensgrense

Kontrakten beskriver PII-frie observasjoner fra Utekos sin
Shopify App Web Pixel. En gyldig observasjon sier bare at
pikselen observerte et dokumentert Shopify-standardevent. Den er
en offentlig, forfalskbar nettleserobservasjon og beviser ikke:

- en autoritativ eller kanonisk commerce-hendelse;
- en lagret frakt- eller betalingsrevisjon;
- godkjent eller vellykket betaling;
- levering til Google, Meta, Microsoft eller en annen provider;
- produksjonsaktivering, samtykkefinalitet eller attribusjon.

`add_shipping_info`, `add_payment_info`, `checkout_error` og
`payment_error` forblir `blocked_source` i den kanoniske
eventmatrisen. Endring av den statusen krever en separat
beslutning og godkjenning.

## Tillatte observasjoner

| Shopify-event                      | Obligatoriske eventfelt     | Betydning                                                                     |
| ---------------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| `checkout_shipping_info_submitted` | `checkoutToken`, `commerce` | Shopify observerte innsending/valg av fraktinformasjon.                       |
| `payment_info_submitted`           | `checkoutToken`, `commerce` | Shopify observerte innsending av betalingsinformasjon. Ikke betalingssuksess. |
| `alert_displayed`                  | `alert.type=CHECKOUT_ERROR` | Shopify viste et generelt checkout-varsel.                                    |
| `alert_displayed`                  | `alert.type=PAYMENT_ERROR`  | Shopify viste et betalingsrelatert varsel.                                    |

`eventId` er kildeidentiteten for deduplisering. `eventSequence`
er kun diagnostisk rekkefølge i pikselstrømmen og må aldri brukes
som en lagret revisjon. `occurredAt` beskriver kildeeventets
tidspunkt, også når Shopify leverer et registrert event etter
senere samtykke.

## Personvern og minimering

Kontrakten er en eksplisitt allowlist.
`additionalProperties: false` gjelder på alle objektnivåer.
Følgende skal aldri inngå:

- navn, e-post, telefon, postadresse eller andre
  kundeopplysninger;
- `clientId`, cookies, klikk-ID-er eller andre
  markedsføringsidentifikatorer;
- URL, query string, referrer, user agent eller full
  event-context;
- line items, produktnavn, betalingsmetode, gateway eller
  transaksjonsdetaljer;
- `alert.message`, `alert.target` eller `alert.value`, fordi de
  kan inneholde fritekst eller feltverdier;
- kanoniske eventnavn, providerstatus, outbox- eller
  leveringspåstander.

De fire personvernflaggene er et snapshot fra Shopify ved
observasjonen. De er ikke et selvstendig juridisk grunnlag for
videre behandling.

## Versjonering og distribusjon

- `contract` er alltid `utekos.shopify.checkout_observation`.
- `schemaVersion` er heltallet `1` for denne versjonen.
- v1 er uforanderlig etter at en produsent eller konsument er
  tatt i bruk.
- Enhver ny egenskap, ny tillatt enumverdi, endret validering
  eller endret betydning krever en ny versjonsmappe og nytt
  versjonsnummer.
- Produsenter og konsumenter må validere den eksakte versjonen og
  avvise ukjente versjoner fail-closed.
- SHA-256-filen i versjonsmappen identifiserer det normative
  skjemaet. Kopien i Shopify-appen må ha samme byteinnhold og
  samme hash.

TypeScript/Zod-validatoren i
`src/lib/analytics/shopifyCheckoutObservationContract.ts` er den
kjørbare speilingen i `utekos-headless`. Ved avvik er
JSON-skjemaet normativt.

## Offisielle kilder

- [Shopify `checkout_shipping_info_submitted`](https://shopify.dev/docs/api/web-pixels-api/standard-events/checkout_shipping_info_submitted)
- [Shopify `payment_info_submitted`](https://shopify.dev/docs/api/web-pixels-api/standard-events/payment_info_submitted)
- [Shopify `alert_displayed`](https://shopify.dev/docs/api/web-pixels-api/standard-events/alert_displayed)
- [Shopify Web Pixels API](https://shopify.dev/docs/api/web-pixels-api)
- [Shopify pixel privacy](https://shopify.dev/docs/apps/build/marketing/pixels#requesting-consent)

## Development-only mottaker og lager

`utekos-headless` eksponerer i lokal development:

```text
POST /api/development/shopify/checkout-observations
```

Ruten returnerer `404` når `NODE_ENV` ikke er `development`. Den
godtar bare JSON, håndhever en streamingbasert 16 KiB-grense og
validerer hele payloaden mot den strenge Zod-kontrakten før
lagring.

Observasjonene lagres atomisk i den ignorerte, lokale filen
`.development-data/shopify-checkout-observations-v1.json`.
Lageret er adskilt fra canonical ledger og provider-outbox og
inneholder ingen provider-routing. Det overlever lokale
serverrestart så lenge arbeidskopien og filen beholdes, men er
ikke et produksjonslager.

Idempotensnøkkelen består av kontrakt, versjon, kilde, eventnavn
og Shopify `eventId`. En identisk replay øker `observationCount`;
samme identitet med et annet validert payload gir
`409 idempotency_conflict` og overskriver ikke første
observasjon.

## Supabase-observasjonslager

Den versjonerte migrasjonen oppretter den private tabellen
`ops.shopify_checkout_observations`. Tabellen er et normalisert,
PII-fritt observasjonslager og lagrer ikke rå payload eller JSON.
Den har ingen fremmednøkkel eller skrivelogikk mot canonical
ledger eller provider-outbox.

Tabellen håndhever `verification_status=observed`, den eksakte
v1-identiteten, de fire personvernflaggene og tillatte
eventformer. En unik idempotensnøkkel og SHA-256 brukes til
replaykontroll. Første observasjon, identitet og payload-hash er
uforanderlige; kun monotont replay-antall og observasjonstid kan
oppdateres.

RLS er aktivert og tvunget. `public`, `anon` og `authenticated`
har ingen tilgang. `service_role` får bare den tabelltilgangen
som trengs for senere mottakerintegrasjon. En daglig jobb sletter
observasjoner etter 30 dager, med støtte for tidsavgrenset
personvernunntak.

Migrasjon `20260803194441_add_shopify_checkout_observations` ble
anvendt på det kanoniske tracking-prosjektet
`hkoawfbomhnzupcsdggb` 2026-08-03. Produksjonstabellen ble
verifisert tom med tvungen RLS, forventede tilganger,
replay-trigger og retention-jobb. Development-ruten fortsetter å
bruke det lokale fillageret.

## Produksjonsmottaker — aktivert observed-only

Den separate ruten `POST /api/shopify/checkout-observations` er
klargjort for å skrive strengt validerte observasjoner til
`ops.shopify_checkout_observations`. Den bruker samme
streamingbaserte 16 KiB-grense, Zod-validator, idempotensnøkkel
og SHA-256-kontroll som development-ruten. En identisk replay
øker bare det monotone observasjonstallet. Samme nøkkel med en
annen validert payload gir `409 idempotency_conflict` uten
overskriving.

Ruten er fail-closed og returnerer `404 receiver_disabled` med
mindre `SHOPIFY_CHECKOUT_OBSERVATIONS_ENABLED` er eksakt `true`.
Bryteren er satt til `true` kun i Vercel Production.
Produksjonsdeploy `dpl_D3t1qCM6s14w9tpsdH1a4SfMmGmm` er `READY`
og eier `utekos.no`.

Aktiveringstesten 2026-08-04 brukte en PII-fri
`alert_displayed/CHECKOUT_ERROR`-observasjon og beviste:

- første POST ga `204` og `inserted`;
- identisk replay ga `204` og `duplicate`, med
  `observation_count=2`;
- samme idempotensidentitet med endret payload ga
  `409 idempotency_conflict`;
- ukjent `email`-felt ble avvist med `400 invalid_observation`;
- payload over 16 KiB ble avvist med `413 payload_too_large`;
- lagret rad har `verification_status=observed`, analytics=true
  og marketing/preferences/sale-of-data=false;
- den eksakte testidentiteten har null rader i både
  `marketing.event_ledger` og `ops.provider_dispatch_attempts`.

Mottakeren oppretter ikke canonical ledger-rader eller
provider-outbox-rader. Den inneholder ingen GA4-, Meta- eller
Microsoft-levering.

Read-only produksjonsinventering i Shopify Admin 2026-08-03 viste
at den eksisterende Custom Pixel-en `Utekos GA4 Commerce`
fortsatt er tilkoblet og eier GA4 `add_payment_info` fra
`payment_info_submitted` samt GA4 `purchase` fra
`checkout_completed`. Det er ikke del av den nye mottakeren og
ble ikke endret. «Provider deaktivert» for denne fasen gjelder
derfor den nye observed-pipelinen, ikke en påstand om at all
eksisterende Shopify-GA4 er slått av.

Produksjonsappen `Utekos Platform` ble aktivert 2026-08-04 for
`erling-7921.myshopify.com`. Aktiv appversjon er
`utekos-checkout-observations-v1` med Web Pixel-UID
`c02aadbc-9d1a-247d-788d-c1f674288851ae56df7e`. Én
WebPixel-record ble opprettet med den eksakte innstillingen
`https://utekos.no/api/shopify/checkout-observations`. Shopify
Admin viser pikselen som `Web / Always on`, med påkrevd
analytics-samtykke, uten marketing/preference-formål og uten
datasalg.

En første ren produksjons-checkout viste inline-valideringsfeil
uten kunde-, adresse- eller betalingsdata og uten ordre.
`INPUT_REQUIRED` og `INPUT_INVALID` er med vilje ikke tillatt i
v1-kontrakten og produserte derfor ingen observasjonsrad. Dette
nullresultatet beviser hendelsesfilteret, ikke manglende Web
Pixel-lasting.

En senere kontrollert checkout 2026-08-04 hadde eksplisitt
analytics-samtykke i Shopifys egen checkout-dialog. Testen brukte
én midlertidig handlekurvvare, slo av e-postmarkedsføring og
sendte ingen kunde-, adresse-, telefon- eller kortdata. Et klikk
på `Betal nå` med tomme obligatoriske felt fikk Shopify til å
publisere `payment_info_submitted`. Det er innsendingsevidens,
ikke betalingsforsøk eller betalingsresultat.

Den nye App Web Pixel-en sendte først CORS `OPTIONS` og deretter
`POST` til produksjonsmottakeren. Begge fikk `204` fra
Vercel-deployment `dpl_D3t1qCM6s14w9tpsdH1a4SfMmGmm`. Supabase
lagret nøyaktig én ny rad med `source=shopify_app_web_pixel`,
`verification_status=observed`, alle fire Shopify-personvernflagg
som `true` og `observation_count=1`. Den eksakte Shopify-
eventidentiteten har null rader i både `marketing.event_ledger`
og `ops.provider_dispatch_attempts`. Observasjonstabellen har
ingen kolonner for navn, e-post, telefon, adresse eller rå
payload. Ingen betaling ble startet, ingen ordre ble opprettet,
og testhandlekurven ble tømt etterpå.

Dette lukker den samtykkede WebPixel-til-mottaker-til-Supabase-
verifikasjonsgaten. Testen endret ikke eksisterende
`Utekos GA4 Commerce`; eventuell trafikk fra den eksisterende
GA4-eieren er utenfor den nye observed-pipelinen.

En senere canonical/provider-cutover må stoppe gammel og starte
ny GA4-eier for samme hendelse i kontrollert rekkefølge. Siden
Custom Pixel-en inneholder begge hendelser, kan den ikke kobles
helt fra når bare én erstatningshendelse er klar.

## Endringsklassifisering

Kontrakten, validatorene, Supabase-lageret, produksjonsmottakeren
og én produksjons-Web Pixel er aktivert for observed-only
innsamling. Aktiveringen omfatter Vercel-miljøbryteren og
produksjonsdeployene som er dokumentert over. Den oppretter
fortsatt ingen canonical ledger-rad, provider-outbox-rad eller ny
GA4-, Meta- eller Microsoft-levering. Canonical/provider-cutover
forblir en separat, hendelsesvis og godkjenningsgated fase.
