# Samtykket besøksreise og handelslogger

Lokal releasekandidat 2026-09-06. Ingen produksjonsutrulling
eller migrasjon er utført som del av implementeringen. Naturlig
Purchase-readback etter release er ikke verifisert.

Verifiseringsstatus 2026-09-07: 90 målrettede tester er bestått.
Kontraktkontroller, kontrakttester, Next typegen,
edge-typekontroll og journey-lint bestod første kontroll. Tre
TypeScript-feil er rettet; full typekontroll og ni berørte tester
består etter rettingen. En inkompatibel `runtime`-eksport er
fjernet fra mottakerruten, og det påfølgende produksjonsbygget
bestod. Gateway-smoke mot produksjon bestod; lokal Next-server
manglet Vercels `no-store`-header. Dette er separate runtimebevis
og dokumenterer ikke den nye koden i produksjon.

Ny kontrollkjøring bestod bygg, typekontroll, lint og alle ti
integrerte nettleserscenarioer: current/legacy på desktop/mobil,
aksept og blokkert lagring, samt sent samtykke på current.
Uten analysesamtykke tildeler nettstedet ikke legacy-varianten;
den tilstanden testes derfor på den faktisk renderte current.
Alle ni innholdsseksjoner, lenkeklikk, ankomst, tilbakeknapp,
tilbaketrekking og ny reise etter nytt samtykke er kontrollert.
Nettlesertransporten var avskåret fra eksterne writes; dette er
lokalt runtimebevis, ikke produksjons- eller leveringsbevis.

Tolv kontroller med faktiske migrasjoner og SQL i isolert
PGlite består, inkludert tilgang, deduplisering, retensjon og
tidslinjekobling. pg_cron-registreringen var simulert.
Tretten kontroller består også på isolert PostgreSQL 17.11 med
samme Postgres.js-driver som appen, inkludert to samtidige
tilkoblinger som venter på commit og deretter gir korrekt
duplikat-/konfliktkvittering. Denne kontrollen fant og verifiserte
rettingen av dobbel JSON-koding i parameterbindingen.
Supabase-lint av de berørte ops-funksjonene bestod på denne
databasen uten skjemafeil. Migrasjons-dry-run mot Supabase viser
bare de to nye observability-migrasjonene. Ingen
produksjonsmigrasjon eller release er godkjent eller utført.

## Datakontrakt og kilder

`src/lib/observability/journey/contract.ts` er den kjørbare,
strenge Zod-kontrakten for `POST /api/observability/journey`.
Mottakeren krever samme origin, JSON, maksimalt 8 KiB og
uttrykkelig analysesamtykke. Eventtid må være innen siste 24
timer og maksimalt fem minutter frem. Nettleserens
samtykkeopplysning og handling merkes `browser_reported`; dette
er ikke bevis for et menneske. Verifisert syntetisk trafikk og
roboter merkes separat fra `human_or_unknown`. Serverens
Vercel-miljø, deploy-ID og SHA eier runtimefeltene.

| Logg/event                                               | Handling og bekreftelse                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `commerce.event` / `add_to_cart` / AddToCart             | Nettleserrapport etter vellykket Shopify-handlekurvhandling                |
| `commerce.event` / `begin_checkout` / InitiateCheckout   | Nettleserrapport om startet checkout-overlevering                          |
| `commerce.event` / `add_shipping_info` / AddShippingInfo | Shopify-kildehendelse for valgt fraktrate                                  |
| `commerce.event` / `add_payment_info` / AddPaymentInfo   | Shopify-kildehendelse for innsendt betalingsinformasjon; ikke betalt ordre |
| `commerce.event` / `add_to_wishlist` / AddToWishlist     | Nytt element lagret i ønskelisten; eksisterende element teller ikke igjen  |
| `commerce.event` / `generate_lead` / Sign Up Utekos Dun  | Dun-påmeldingen er lagret; andre leadskjemaer vises som GenerateLead       |
| `commerce.event` / `purchase` / Purchase                 | Verifisert Shopify paid-order webhook eller betalt-ordreavstemming         |
| `journey.event` / `utm_landing_page_view`                | En kvalifisert nettlesersidevisning på `/skreddersy-varmen`                |
| `journey.event` / `page_arrival`                         | En faktisk observert sideankomst; et lenkeklikk er ikke en ankomst         |
| `journey.event` / `section_view`                         | Seksjon i viewport i ett sekund, én gang per målt sidevisning              |
| `journey.event` / `internal_link_click`                  | Stabil lenke-ID, kildeseksjon og sanitert målsti                           |
| `journey.event` / `journey_progress`                     | Største observerte scrollposisjon og sist synlige seksjon                  |

AddShoppingInfo normaliseres til AddShippingInfo, AddToWishlsit
til AddToWishlist. `status`/`persistence` skiller lagret event
fra duplikat. `actionEvidence` beskriver handlingens kilde.
Providerlevering leses separat fra
`ops.provider_dispatch_attempts`; loggen lover ikke levering,
attribusjon eller betaling bare fordi et event er lagret.

## Samtykke og målegrense

Målingen starter først når Cookiebot har et svar og
`statistics=true`. Markedsføringssamtykke alene aktiverer ikke
reisen. Før dette sendes ingen nye scroll- eller klikkhendelser.
Eksisterende nødvendige drifts-, handels- og samtykkeloggdata
beholdes gjennom sine eksisterende flyter.

En gyldig UTM-landing starter en kohort i samme fane. UTM-feltene
valideres enkeltvis; e-post, URL-er, ukjente felter og lange
nummeridentifikatorer forkastes. Ingen annonse-ID-er,
kontaktdata, betalingsdata eller rå handlekurv-/checkout-token
lagres i de nye loggene. Sidestier har ingen query/hash og
skjuler sensitive ruter/identifikatorer.

Eksisterende analytics-gated `journey_id` og `page_view_id`
gjenbrukes. Intern navigasjon beholder reisen; blokkert
sessionStorage bruker minne for samme dokument. En full reload
med blokkert lagring kan ikke sammenkobles. Ved sent samtykke
observeres bare nåværende og senere posisjon; tidligere
scroll/klikk rekonstrueres ikke. Tilbaketrekking stopper
observatører, kansellerer pending retry og fjerner
reisekoblingen. Nytt samtykke starter ny reise.

Seksjonene er hero, empati, kjøpsseksjon, kjøpsknapp, tre-i-én,
TechDown, kundeomtaler, FAQ og bunnavigasjon. Begge
landingvariantene bruker de felles promotionmarkørene; empati,
FAQ og bunnavigasjon har egne markører på innholdet. Geometrisk viewport-synlighet er
et observasjonssignal, ikke bevis for oppmerksomhet.

`max_scroll_y` er største observerte vertikale scroll i piksler.
`max_scroll_percent` er største observerte viewport-bunn som
andel av dokumenthøyden. Dokument- og viewporthøyde følger
eventet. Endret fremdrift sendes maksimalt hvert femte sekund, og
ved skjuling, sideskifte eller `pagehide`. Et manglende
sluttsignal betyr **sist observert**, aldri sikkert frafall.
Nettleser-/nettverksavbrudd kan miste signaler. Transporten
bruker keepalive og høyst tre forsøk med samme event-ID,
begrenset til 64 pending hendelser i minne; ingen varig klientkø.

## Handel og lagring

Dun-påmelding viderefører analytics-gated reise-/sidevisnings-ID.
Checkout bruker eksisterende `begin_checkout_event_id`. Frakt,
betalingsinformasjon og Purchase kobles til akkurat dette
eventet, bare med samsvarende samtykke, miljø, valuta og
kildevindu. Manglende kobling får eksplisitt årsak som
`begin_checkout_event_id_missing`, `begin_checkout_not_found`
eller `lookup_unavailable`. En koblingsfeil skal ikke hindre
lagring av betalt ordre.

Atferd lagres privat i `ops.journey_events`; handelsdata blir i
`marketing.event_ledger`. Deduplisering ligger i tabellens unike
event-ID og payload-hash: samme payload er duplikat, endret
payload med samme ID gir409. Redis får ingen ny varig
lagringsrolle. RLS er aktiv og tvunget, anon/authenticated har
ingen rettigheter; tjenesten har bare SELECT/INSERT. Migrasjonen
må gjennomgås og godkjennes før produksjon.

Rå atferd slettes automatisk innen 14 måneder med timeskjørt
pg_cron og én times konservativ margin. Teknisk loggretensjon
skal være maksimalt30 dager; Vercel-planens faktiske retensjon og
eventuelle eksisterende drains må verifiseres ved release. Denne
endringen oppretter ingen drain eller ny dashboardplattform.

En separat migrasjon retter den eksisterende daglige slettingen
av request-, trace- og samtykkeobservasjoner til timekjøring med
én times margin. Eksisterende tidsavgrensede juridiske unntak
bevares; journey-atferd får ingen slike automatiske unntak.
Produksjonsfunksjon, cronstatus og faktiske aldersgrenser må
leses tilbake etter godkjent apply.

Konfigurasjonskontroll 2026-09-07 fant en eksisterende aktiv
Datadog-integrasjon som bare omfatter Utekos, med logg- og
trace-drain. Operatøren opplyser at Datadog ikke brukes.
Deaktivering er foreslått og krever eget samtykke; leverings-
og retensjonsstatus hos Datadog er ikke bekreftet. Aktiv
Supabase log-drain v107 samsvarer nøyaktig med de ti lokale
kilde-filene. Den filtrerer ut API/POST og lagrer ikke de nye
runtime-meldingene som rålogger.

## Søke- og tidslinjerapport

I Vercel Runtime Logs: velg riktig prosjekt, deploy og tidsrom.
Søk først på den eksakte UUID-en, og snevre inn med
`journey.event` eller `commerce.event`. Commerce-loggens felt
bruker `journeyId`/`eventId`; journey-loggen bruker
`journey_id`/`event_id`. Kontroller både ID, kilde, samtykke,
bekreftelsesnivå, status og runtime-SHA. Et request til
landingssiden er ikke bevis for en nettlesersidevisning.

Lesebasert tidslinje, med repoets Node aktivert og eksisterende
lokale databaselegitimasjon:

```sh
pnpm exec tsx scripts/ops/journey-timeline.ts --journey <UUID> --limit 500
```

Rapporten bruker en read-only-transaksjon, parametrisert UUID,
tidsgrense og maksimalt2000 hendelser. Den slår sammen private
journey-rader, handelsledger og separate providerkvitteringer.
Bare lagrede, samtykkede `journey_id`-koblinger inngår. Rapporten
rekonstruerer ikke kobling fra et `begin_checkout_event_id` som
innlastingen avviste. `truncated=true` betyr at rapporten ikke
viser alle hendelser; `provider_receipts_truncated=true` betyr at
kvitteringslisten er avkortet. Rå providerpayloads, kontaktdata
og transaksjons-/checkout-token skrives ikke ut.

## Releasebevis og begrensninger

Før release: målrettede tester, genererte kontraktkontroller,
Next typegen, typecheck inklusive edge functions, build,
gateway-smoke og Supabase-lint. Lokal observatørtest i Chromium
dekker mobil/desktop, samtykke, sen oppstart, dwell, lenkeklikk
kontra ankomst, skjuling og ny reise etter tilbaketrekking. Dette
erstatter ikke en integrert runtimekontroll av begge faktiske
landingssider.

Gjennomgå hele checkoutens diff, inklusive samtidige uvedkommende
endringer. Arbeid bare på `main`; etter releasegodkjenning er
`pnpm run sync` eneste deployvei. Før apprelease må migrasjonen
være godkjent og anvendt med verifisert historikk/paritet.

Etter release: bevis eksakt SHA, kontrollert event-ID i Vercel og
samme ID/SHA i Supabase. Kontroller begge sidevarianter,
mobil/desktop, tilbakeknapp, skjult fane, blokkert lagring og
alle samtykketilstander. Ingen testbetaling opprettes.
Frakt/betaling krever Shopify-kildehendelser; naturlig
Purchase-readback står som uverifisert til betalt ordre er
observert. HTTP200 eller READY alene er ikke ferdigbevis.

Offisielle kilder kontrollert via dokumentasjons-MCP:
[Vercel Runtime Logs](https://vercel.com/docs/logs/runtime),
[Vercel Analytics privacy](https://vercel.com/docs/analytics/privacy-policy),
[Next.js usePathname](https://nextjs.org/docs/app/api-reference/functions/use-pathname),
[MDN Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API),
[MDN sendBeacon og skjuling](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Nkom cookies](https://nkom.no/internett/informasjonskapsler-cookies).
