# Forlatt kasse via Resend

## Aktiv lokal kontrakt

Recovery-sekvensen består av tre e-poster med forfall etter 4, 24 og 72 timer.
Vercel Cron starter en varig Workflow som oppdager, revaliderer og sender via
Resend. `ABANDONED_CHECKOUT_RECOVERY_ENABLED` er fail-closed; manglende verdi
betyr deaktivert. `ABANDONED_CHECKOUT_RECOVERY_ACTIVATION_AT` avgrenser hvilke
forlatte kasser som kan tas med.

Den eksisterende Shopify-mekanismen for segmenter beholdes. Segmentene er
dynamiske Shopify-spørringer basert på `abandoned_checkout_date`; recovery-
backend skal verken erstatte, tagge om eller slette dem.

## Checkout-progresjon i produksjon

Read-only kontroll 2026-09-10 bekrefter at Shopify App Pixel-hendelsene allerede
er koblet til den kanoniske headless-flyten. Ingen ny sporingskode eller
provideraktivering er nødvendig som del av e-postimplementeringen:

- `checkout_shipping_info_submitted` gir `add_shipping_info`: 46 ledger-rader
  siden 2026-08-17, sist observert 2026-09-09. Meta har 46
  `accepted_unverified`-forsøk.
- `payment_info_submitted` gir `add_payment_info`: 71 ledger-rader siden
  2026-08-04, sist observert 2026-09-06. Google har 69 `succeeded` og to
  `skipped_unqualified`; Meta har 39 og Snapchat 24
  `accepted_unverified`-forsøk.

Begge eventene betyr at det aktuelle checkout-trinnet ble sendt inn. De beviser
ikke at frakt eller betaling lyktes. `accepted_unverified` beviser bare teknisk
provideraksept, ikke rapportering, attribusjon eller annonselevering. Den
separate app-lokale MCP-ledgeren er utviklingsdata med provider-outbox
deaktivert og skal ikke brukes som fasit for produksjonsflyten.

## Variantbildekjede

Før utsendelse hentes kassen på nytt fra Shopify. Bildet velges deterministisk
i denne rekkefølgen:

1. merchant-owned variantmetafelt `utekos.recovery_email_image`
   (`PRODUCTVARIANT`, `file_reference`);
2. første-parts variantbilde fra den lokale GTIN-bildekatalogen;
3. Shopifys bilde på den aktuelle linjen;
4. ingen produktillustrasjon dersom ingen kilde er gyldig.

Metafeltet opprettes gjennom den autentiserte adminhandlingen i Utekos Platform-
appen, ikke som `$app`. `$app` er bundet til eierappen og kan derfor ikke brukes
som delt kontrakt mellom plattformappen og den separate headless Admin-klienten.
Storefront-tilgang er `NONE`; e-postmotoren leser feltet via Admin GraphQL.

E-postklienten får vanlig responsiv HTML. Det brukes ikke én Open Graph-fil med
brukeragentlogikk, fordi e-postklienter ikke gir en pålitelig serverstyrt
mobil/iPad/desktop-kontrakt. Bildestørrelse og layout håndteres i selve HTML-en.

## Utsendelsesporter

Hver e-post krever fremdeles gyldig mottaker, markedsføringsgrunnlag, ikke-
fullført kasse, ingen nyere relevant ordre eller draftordre, tilgjengelig lager,
korrekt aktiveringstid og en tillatt Shopify recovery-URL. Resend bruker en
deterministisk idempotency key. Levering, bounce, complaint og suppression
readback lagres separat; provideraksept er ikke det samme som innbokslevering.

Se `DEPLOYMENT.md` for migrasjon, canary og produksjonsaktivering.
