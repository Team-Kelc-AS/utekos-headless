# Senere samtykkebanner og atskilt driftsoversikt

Status: **lokal implementering på main, ikke publisert eller
produksjonsverifisert**. Dato: 10. september 2026.

Dette er leveransen til den godkjente implementeringsplanen, ikke
en godkjenning av produksjonspublisering eller en juridisk
garanti. Koden, Cookiebot-malen, GTM-endringslisten og
databasemigreringen er separate leveranser. Ingen publisering,
migrering, historisk sletting eller annonseendring er utført i
denne implementeringsrunden.

## Hva som er endret

- Presentasjonen venter på **åtte sekunder med synlig side og
  minst 25 prosent scrolling**, eller første fullførte navigasjon
  til en annen sidesti. Prefetch, anker og
  variant-/spørringsendringer utløser ikke navigasjonsregelen.
  Tersklene er brukerens startvalg, ikke dokumentert optimal
  konverteringspraksis.
- Personverninnstillinger er tilgjengelige fra starten. Åpnet
  dialog har bakgrunnslås, tastaturfokus og tre likeverdige valg.
  Ingen X, bakgrunnslukking eller samtykke gjennom scrolling.
  Escape velger ingenting og viser hvordan man fortsetter uten
  valgfri sporing.
- Cookiebot er fortsatt samtykkemotor. **GTM-tag 126 er eneste
  Cookiebot-laster**. Appens nye skript styrer bare presentasjon;
  det laster ikke `uc.js`, lagrer ikke samtykke og sender ikke
  engasjementsdata.
- Den egendefinerte, norske knappen er eneste synlige kontroll
  for å åpne personverninnstillingene. Cookiebots separate
  `#CookiebotWidget` skjules for å unngå en duplikat kontroll som
  overlapper både knappen og samtykkedialogen på små skjermer.
- Eksplisitt, gyldig kategorivalg kreves før appen leser
  sporingslagring, bygger sporingshendelser, beriker,
  mellomlagrer eller sender dem. Manglende/implisitte valg åpner
  ikke de valgfrie app-funksjonene.
- Foreløpige sidevisninger fra før samtykke er fjernet fra den
  nye klientflyten. Gamle capture-kall uten valgfritt samtykke
  får **403 `consent_required`** uten lagring av
  hendelsesinnhold. Ordinære collectorer beholder sitt
  204-avvisningsformat med avvisningsheader.
- Ingen tidligere sidevisninger sendes senere når kunden godtar.
  Den gjeldende siden registreres med nytt tidspunkt og
  hendelses-ID. Køer og asynkrone operasjoner kontrollerer
  samtykke på nytt før sending.
- Eksisterende etter-samtykke ID- og dedupliseringsmekanismer
  beholdes i klient/server-transportene. Tester beviser lokale
  kontrakter; faktisk Pixel/CAPI-deduplisering må fortsatt
  kontrolleres hos leverandøren.
- Statistikksamtykke åpner ikke klikk-ID-er, kampanjeattribusjon
  eller markedsførings-ID-er. Markedsføringssamtykke alene åpner
  ikke GA-ID-er, statistiske besøksreiser eller Vercel Analytics.
- Vercel Web Analytics, Speed Insights og egen rapportering av
  webvitals krever statistikk. URL-spørringer fjernes fra
  Vercel-hendelser, og sendekontrollen sjekker samtykke på nytt.
- Endring/tilbaketrekking av et eksisterende valgfritt samtykke
  laster siden på nytt for å stoppe allerede innlastede SDK-er.
  Første samtykkevalg krever ikke omlasting. Dette må verifiseres
  med ekte Cookiebot og leverandørskript, ikke bare malen.
- Nødvendige handlekurv-/checkout- og ordreoperasjoner er ikke
  gjort avhengige av markedsføring. Uten samtykke inneholder et
  checkout-samtykkesnapshot bare nødvendig samtykketilstand.
- De gamle koblingsinngangene `landing-consent` og
  `page-view-dispatch` returnerer nå **410** uten å lese kropp
  eller skrive til database. Vanlige nettleserbesøk får ikke
  lenger den gamle operasjonelle korrelasjonstokenen.

Det særskilte **UTM-koblede besøksforløpet** krever både
statistikk og markedsføring i første versjon. Den ordinære,
ikke-annonsekoblede analysereisen kan fortsatt bruke
statistikksamtykke. Dette er en bevisst strengere formålsdeling,
ikke en påstand om at all førstepartsanalyse juridisk alltid
krever begge kategorier.

Korte besøk som slutter før samtykke vil ikke gi en ordinær målt
sidevisning. Tapet skal vises som en målebegrensning, ikke fylles
igjen med skjult mellomlagring eller tilbakedatering. De
pensjonerte koblingsinngangene endrer også sammenlignbarheten med
gamle rapporter.

## Operasjoner og oppbevaring

[operations.v1.json](operations.v1.json) er det versjonerte
registeret over faktiske operasjoner, opplysninger, formål,
mottakere, kategorier, oppbevaring, kildekode og bevisnivå. **B
er ikke automatisk tillatelse.**

Loggdrainens nye `operational_v1` fjerner annonseklikk-ID-er,
HMAC, kampanjefelt, referrer, nettleser-/enhetsprofiler og
nettleserbasert besøkskobling. Normaliserte ruter, kilde, status
og overførte byte beholdes. Interne
forespørsels-/logg-/trace-ID-er brukes bare til avgrenset
feilsøking i detaljgrunnlaget; de finnes ikke i aggregatene.

Klientfeil filtreres både før sending og ved mottak. Fri
feiltekst erstattes med avgrensede feilklasser. Appens
`onRequestError` logger ikke lenger frie feilmeldinger, stack
eller full forespørselsadresse.

Den nye migreringen inneholder:

- privat driftskontroll med aggregering **AV som standard**;
  aktivering krever registrert godkjenningstidspunkt og
  ansvarlig;
- privat daglig aggregat uten besøks-ID-er, personprofiler eller
  annonsekoblinger;
- inntil syv dager for nye detaljrader, med timevis rydding og
  dokumenterte unntak for lovlig oppbevaring;
- 90 kalenderdager for aggregater;
- ingen massesletting eller omklassifisering av gamle rader.
  Tidligere utløpsrutiner videreføres.

Aggregatet teller **loggobservasjoner**, ikke unike besøkende,
sesjoner, LPV eller nødvendigvis dedupliserte HTTP-forespørsler.
Responsstørrelse er ikke responstid; responstid skal ikke
konstrueres fra felt som ikke måler dette.

### Åpne personvernkontroller hos leverandører

Dette endrer oppbevaringen i det nye Supabase-grunnlaget, **ikke
automatisk Vercels egne logger**. Tidligere oppgitt
provider-oppbevaring på opptil 30 dager er ikke konfigurert ned
til syv dager her. Formål og lagringstid må avklares og
innarbeides i personvernteksten før samlet publisering.

Eksisterende `registerOTel` er kartlagt, men ikke blindt fjernet
eller omkonfigurert. Utgående span-attributter, automatisk
framework-feillogging og faktisk provider-oppbevaring er fortsatt
en åpen kontroll. Minimeringen i appens egen feil-hook beviser
ikke at Next.js eller Vercel aldri logger andre feilopplysninger.
Ingen ny B-bruk av slike data er godkjent gjennom denne
leveransen.

## Cookiebot og GTM: klargjort, ikke publisert

[cookiebot/banner.html](cookiebot/banner.html),
[CSS](cookiebot/banner.css) og [JavaScript](cookiebot/banner.js)
er tilpasset Cookiebots dokumenterte Premium-presentasjon.
Visningsfunksjon: `utekosCookiebotShow`. Skjulingsfunksjon:
`utekosCookiebotHide`.

Appskriptet ligger i
[public/consent/utekos-presentation.js](../../public/consent/utekos-presentation.js).
Hvis dette ikke er tilgjengelig, har malen en umiddelbar dialog
med eksplisitte valg. Ingen valgfri kategori skal åpnes ved
presentasjonsfeil.

[gtm-required-changes.v1.json](gtm-required-changes.v1.json)
beskriver kun ekstra samtykkekrav for tag **160, 172, 173 og
174**, basert på publisert web-GTM versjon **160**. Særlig
viktig: 172–174 har GA4-navn, men faktisk Microsoft UET-type.
Parametere, triggere og pausetilstand skal bevares. Tag 126
beholdes, og pauset 153/170/171 skal ikke aktiveres som
bivirkning.

Før GTM-publisering må live-versjon leses på nytt. Stopp ved
drift i versjon/fingerprints; ikke skriv over andre endringer.
Bevis én `uc.js`-forespørsel, `implementation=gtm`, avviste
standardverdier og ingen feilaktig samtykkeoppdatering fra et
gammelt implisitt valg. Appens kontroll av `consent.method` er
ikke i seg selv bevis for at GTM behandler gamle valg riktig.

## Teststatus

Testresultater gjelder lokal kode, ikke publiserte leverandører.
Sluttkjøringene omfatter **208 beståtte, målrettede tester**: 164
klient-/drifts-/besøksforløpstester, 38 servercollector-tester og
seks Google-oppstartstester. Dette er ikke hele repositoriets
testsamling.

| Kontroll                                                                | Resultat / avgrensning                                                                                                      |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Klient, transport, banner, provider, drift og besøksforløp              | 164 bestått; inkluderer cookie-lesing etter asynkron tilbaketrekking, kategoriskille og kildefelt                           |
| Servercollectorer og normalisering                                      | 38 bestått; ingen lagring ved avvisning og ingen GA-ID-er med bare markedsføring                                            |
| Google-oppstart                                                         | Seks bestått; standard avvist og ingen kampanjeparametere ved statistikk alene eller implisitt valg                         |
| Typesjekk app og Edge Functions                                         | Bestått også i sluttjobben 10. september 2026 kl. 03.29 norsk tid                                                        |
| ESLint på berørte kodefiler / diff-kontroll                             | Bestått uten feil eller advarsler; ingen release utført                                                                     |
| GTM/sGTM produksjonsgateway                                             | Eksisterende gateway besto GET-helsesjekk, no-store og cache MISS; ikke bevis for ny implementering                         |
| Lokal gateway                                                           | Tidligere lokal kontroll feilet på cache-kontrakt; ikke skjult eller gjort mindre streng                                    |
| Lokal PostgreSQL/Supabase lint                                          | **Blokkert**: ingen database på 127.0.0.1:54322. Migreringen er ikke prøvd mot database; statiske tester er ikke erstatning |
| Fullt produksjonsbygg                                                   | Bestått lokalt: Next.js 16.3.1, vellykket kompilering og 170/170 statiske sider; ikke deployert                                    |
| Ekte Cookiebot, GTM, leverandørnettverk, Pixel/CAPI og Shopify checkout | **Ikke produksjonsverifisert**                                                                                              |
| Mobil, Safari, skjermleser og treg/blokkert ekte CMP                    | Gjenstår; desktop-sjekken dekker ikke disse                                                                                 |

Sluttjobben `job-mtuulx52-b3663772` avsluttet med kode 0 den 10.
september 2026 kl. 03.29 norsk tid. Rute-/typegenerering,
app-typesjekk, Edge Functions-typesjekk og produksjonsbygg
bestod. Bygget ga lokale miljøvarsler om manglende Vercel-region
og Runtime Cache, samt trege Shopify-lesekall som svarte HTTP
200. Dette er ikke bevis for feil i produksjon, men heller ikke
en produksjonsverifisering. Database- og nettleserportene over
er fortsatt åpne; ingen publisering er utført.

### Lokal forhåndsvisning

En isolert malforhåndsvisning finnes på
[127.0.0.1:4873](http://127.0.0.1:4873/) mens
forhåndsvisningsserveren kjører. Den bruker en **simulert
Cookiebot-API** og sender ingen provider-hendelser. Den er ikke
en produksjonslenke eller bevis for reelt lagret samtykke.

Desktop-kontroll viste: ingen dialog ved første visning, åpning
ved navigasjon og manuell handling, låst bakgrunn, fokus på
tittel, Escape uten lukking, og korrekte verdier for avvisning,
bare statistikk, bare markedsføring og alle kategorier.
Tids-/scrollkombinasjon, synlig tid og feiltilfelle er også
testet som lokale kontrakter. Button-høyde er 48 px; farger og
tastaturfokus er kontrollert i forhåndsvisningen. Full WCAG 2.2
AA-verifisering er ikke avsluttet.

Den ekte lokale Next-appen laster ikke produksjons-GTM i vanlig
utviklingsmiljø. Når Cookiebot derfor mangler, viser den manuelle
knappen en tydelig melding og ingen valgfri behandling åpnes.

## Publiseringsrekkefølge og stoppunkter

1. Gjennomgå diff, sluttkjør tester og fullt bygg. Løs
   databasekontrollen uten å bruke produksjonsmutasjoner som en
   lint-snarvei. Avklar de åpne trace-/provider-retensjonsfeltene
   og reelle nettlesertestene.
2. Få eksplisitt publiseringsgodkjenning for app, Cookiebot/GTM
   og Supabase-migrering/function hver for seg. Planlagt
   implementering er ikke publiseringskvittering.
3. Kontroller migreringshistorikk på nytt. Kjør den konkrete
   migreringen før oppdatert `vercel-log-drain`, ellers kjenner
   ikke databasen `data_policy`. Hold B-aggregering avslått uten
   særskilt godkjenning. Verifiser RLS, minimering,
   avbrutt/gjentatt batch, oppbevaring og godkjenningskontroll.
4. Apppublisering skal bare bruke prosjektets `pnpm sync "…"` fra
   synkronisert main etter godkjent diff. Ingen alternativ git
   push, gren eller Vercel-prod-rute. Kontroller eksakt samme SHA
   på main, origin/main og Vercel READY.
5. Publiser den forberedte Cookiebot-presentasjonen og
   GTM-samtykkekravene i separat godkjent, koordinert løp. Ny app
   kan eksistere med gammel umiddelbar dialog, men **sen visning
   må ikke slås på før innsamlingen er stoppet**. Ingen dobbelt
   Cookiebot-laster.
6. På utekos.no: kontroller nettverk, lagringstilgang, dataLayer,
   samtykke, collectorer, Supabase og leverandørkvitteringer.
   Test nye brukere, gamle ID-er uten gyldig valg, alle fire
   kategorivalg, tilbaketrekking, direkte landing, SPA,
   query/ankernavigasjon og blokkert/treg CMP.
7. Verifiser produktvalg, handlekurv, checkout og riktig
   nåværende hendelses-ID/deduplisering uten å gjennomføre
   betaling eller ekte ordre. Godkjent HTTP eller akseptert
   opplastingskvittering er ikke full sporingsverifisering.

Ved feil skal en umiddelbar, eksplisitt dialog kunne brukes.
Tilbakerulling skal **beholde innsamlingsportene og avvisningen
av forhåndslagring**. Ikke rull tilbake hele pakken til den gamle
sporingsbufferen for å reparere en visningsfeil.

## Dokumentasjon brukt

Kildene er kontrollert gjennom MCP/offisiell dokumentasjon i
implementeringsrunden; lokal Next.js-instrumenterings- og
skriptdokumentasjon er også lest.

- [Cookiebot API og samtykkehendelser](https://www.cookiebot.com/en/developer/)
  og
  [tilpasset Cookiebot-presentasjon](https://support.cookiebot.com/hc/en-us/articles/26378010233628-Can-I-build-my-own-fully-customized-cookie-consent-banner-Cookiebot-Manager).
- [Google samtykkemodus](https://developers.google.com/tag-platform/security/guides/consent)
  og
  [GTM tag-kontrakt](https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/accounts.containers.workspaces.tags).
- [Vercel Web Analytics](https://vercel.com/docs/analytics/privacy-policy),
  [Speed Insights](https://vercel.com/docs/speed-insights/privacy-policy),
  [før-sending-filter](https://vercel.com/docs/speed-insights/package)
  og
  [serverinstrumentering](https://vercel.com/docs/tracing/instrumentation).
- [Next.js Script](https://nextjs.org/docs/app/api-reference/components/script),
  [serverfeil-hook](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
  og
  [Supabase-migreringer](https://supabase.com/docs/guides/deployment/database-migrations).
- [Datatilsynets cookie-veiledning](https://www.datatilsynet.no/personvern-pa-ulike-omrader/internett-og-apper/bruk-av-informasjonskapsler-og-andre-sporingsteknologier/)
  og
  [ekomloven § 3-15](https://lovdata.no/lov/2024-12-13-76/§3-15).
  Rettslig klassifisering er formålsavhengig; B-poster er ikke
  aktivert som følge av kildehenvisningene.
