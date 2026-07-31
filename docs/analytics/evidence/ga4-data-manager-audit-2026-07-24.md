# GA4- og Data Manager-revisjon — 24. juli 2026

> **Statuspresisering 2026-07-31:** Påstanden under om å mappe
> `payment_info_submitted` til `add_payment_info` er erstattet av
> [KRI-24-kildebeslutningen](kri-24-shopify-checkout-step-source-decision-2026-07-31.md).
> Shopify dokumenterer innsending, ikke et akseptert betalingssteg. Repoets
> pikselartefakt holder derfor eventet fail-closed. Historisk
> Shopify-konfigurasjon er ikke ferskt produksjonsbevis og ble ikke publisert
> eller endret i KRI-24.

## Konklusjon

Google Analytics brukes i dag til innsamling, attribusjon,
annonsekoblinger, kostnadsimport og rapportering, men oppsettet
er ikke beslutningsklart. GA4 har en fungerende Data
Manager-integrasjon. En eldre Measurement Protocol-avsender har
sendt mangelfulle kjøp og skapt de tre hastevarslene i
nettstrømmen. Den tilhørende hemmeligheten er nå tilbakekalt i
GA4 og fjernet fra Vercel, slik at fremtidige kall med den gamle
legitimasjonen blir avvist.

Measurement Protocol skal ikke repareres. Den skal fjernes. Data
Manager API er allerede den kanoniske servertransporten og må
være eneste servereier av `purchase`, med nettlesertaggen som
samtykkestyrt sesjonskilde og samme transaksjons-ID for
deduplisering.

Den samtykkestyrte Shopify-pikselen er nå lagret og koblet til i
produksjon. Google Ads-kontoen er også kontrollert direkte. Der
ble tre utdaterte GA4-importer funnet som aktive
primærkonverteringer, men Google Ads nekter oppryddingen mens
kontoen er sperret.

## Omfang og direkte tilgang

Revisjonen har hatt direkte lesetilgang til:

- GA4-konto `355541076`, egenskap `489598217` og nettstrøm
  `11228676020`;
- GA4 Data API for hendelser, nøkkelhendelser, inntekter,
  målgrupper og trafikkilder;
- GA4-administrasjonen for diagnostikk, dataimport,
  produktkoblinger, nettstrøminnstillinger og Measurement
  Protocol-hemmeligheter;
- Shopify-administrasjonen for Customer Events;
- Vercel-konfigurasjonens variabelnavn, uten å lese verdiene;
- Supabase-tabellene `marketing.event_ledger` og
  `ops.provider_dispatch_attempts`;
- kildekoden for nettleserinnsamling, Shopify-webhooks, kanonisk
  hendelseslager, Data Manager-mapping, leveringskø og
  statusavstemming.

Den bekreftede GA4-adressen er
`https://analytics.google.com/analytics/web/?authuser=4#/a355541076p489598217/reports/intelligenthome`.
Dette verifiserer både konto `355541076`, egenskap `489598217` og
riktig Google-brukerkontekst (`authuser=4`).

## Kontostatus

| Område                    | Verifisert status                                                                                                     | Vurdering                                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Egenskap                  | Utekos Marketing Group \| Analytics, NOK, Europe/Oslo                                                                 | Riktig grunnoppsett                                                                                           |
| Google Ads                | Konto `2842756352` og managerkonto `6676193991` er koblet; annonsetilpasning er på; Ads-kontoen er sperret            | `purchase` er primær, men tre utdaterte handlinger er også primære og kan ikke fjernes før sperringen er løst |
| Merchant Center           | Konto `5806691920` koblet                                                                                             | Riktig                                                                                                        |
| Search Console            | Domenet `utekos.no` koblet til nettstrømmen                                                                           | Riktig                                                                                                        |
| BigQuery                  | Datasettet `analytics_489598217` finnes i `project-c683eb2c-20ae-4ec2-ac3` og har daglige eksporttabeller 8.–23. juli | Fungerende daglig eksport; ingen intradagstabell observert                                                    |
| Egendefinerte dimensjoner | `Skjema ID` (`form_id`) er opprettet                                                                                  | Flere forretningsparametere er fortsatt ikke registrert                                                       |
| Egendefinerte beregninger | Ingen                                                                                                                 | Samme analysebegrensning                                                                                      |
| Målgrupper                | Kun `All Users` og `Purchasers` observert                                                                             | Mangler høyintensjons- og ekskluderingsmålgrupper                                                             |
| Forbedret måling          | Aktiv                                                                                                                 | Riktig, men krever ryddig hendelsestaksonomi                                                                  |
| E-post-/URL-redigering    | Ikke aktiv                                                                                                            | Personvern- og datakvalitetsgap                                                                               |

## Hendelser og nøkkelhendelser

Perioden 25. april–23. juli 2026 inneholder blant annet 22 715
sidevisninger, 7 111 produktvisninger, 769 `add_to_cart`, 250
`begin_checkout` og 183 `purchase`-hendelser.

Nøkkelhendelsesoppsettet er feil:

| Nøkkelhendelse   | Antall | Vurdering                               |
| ---------------- | -----: | --------------------------------------- |
| `scroll`         |  4 088 | Skal ikke være nøkkelhendelse           |
| `add_to_cart`    |    769 | Mikrohendelse, ikke forretningsresultat |
| `begin_checkout` |    250 | Mikrohendelse, ikke forretningsresultat |
| `purchase`       |    183 | Skal være primær nøkkelhendelse         |
| `form_start`     |     31 | Skal ikke være nøkkelhendelse           |
| `form_submit`    |      2 | Må avklares mot reell kvalifisert lead  |

`generate_lead` har ti hendelser. Dagens opprinnelige oppsett
overdrev antallet konverteringer og kunne gi annonseplattformene
et svakt optimaliseringssignal. `scroll`, `add_to_cart`,
`begin_checkout`, `form_start` og `form_submit` er nå deaktivert
som viktige hendelser, mens `purchase` er beholdt. Operatøren har
aktivert `add_to_wishlist` og `generate_lead`. For budgivning bør
`purchase` være primær, mens en dokumentert kvalifisert
`generate_lead` kan være sekundær. `add_to_cart` skal brukes som
trakt- og målgruppesignal. `add_to_wishlist` bør uttrykkelig
holdes sekundær i Google Ads, slik at den ikke konkurrerer med
kjøp i budstrategien.

Tre ytterligere viktige hendelser var tomme, utdaterte
definisjoner: `manual_event_PURCHASE`, `ads_conversion_purchase`
og `hero_read_more` hadde ingen hendelser i den kontrollerte
årsperioden og ingen aktiv datastrøm de siste 28 dagene. Ingen av
navnene finnes i publisert web-GTM versjon 132 eller server-GTM
versjon 29. Det kan derfor ikke dokumenteres at
`manual_event_PURCHASE` ble opprettet av Microsoft; den er en
historisk GA4-definisjon uten en nåværende publisert avsender.
Alle tre er nå fjernet som viktige hendelser. Historiske
hendelsesdata er ikke slettet.

Supabase-leveringshistorikken for `microsoft_uet` gir ytterligere
avgrensning: den aktive 90-dagershistorikken inneholder
`purchase` og en eldre variant `Purchase`, men ingen
`manual_event_PURCHASE`. Den historiske GA4-definisjonen kan
dermed ikke tilskrives dagens Microsoft-pipeline. En eldre
manuell Microsoft-/GTM-konfigurasjon kan ikke utelukkes, men er
ikke dokumentert.

Den verifiserte listen over viktige hendelser er nå `purchase`,
`generate_lead`, `add_to_wishlist`, `signup_newsletter` og
`add_payment_info`. De tre første har en aktiv strøm de siste 28
dagene. `signup_newsletter` beholdes etter operatørens
beslutning. `add_payment_info` beholdes og skal gjenopprettes fra
Shopify-hendelsen `payment_info_submitted`.

Den tidligere lagrede egendefinerte regelen for
`signup_newsletter` var feilkonfigurert: den matcher
`event_name = form_submit` og `page_location` som ikke inneholder
`utekos.no`. Produksjonskoden sender i stedet den kanoniske
hendelsen `generate_lead` med `form_id = newsletter_signup` etter
at innsendelsen er akseptert og lagret. Den gamle regelen er
slettet. En ny egendefinert hendelsesdimensjon, `Skjema ID`, er
opprettet for parameteren `form_id`, og den nye
`signup_newsletter`-regelen er publisert med
`event_name = generate_lead` og `form_id = newsletter_signup`,
med kopiering av kildeparametere. Tabellen for egendefinerte
hendelser viser begge betingelsene. Den midlertidig opprettede
tomme nøkkelhendelsen `sign_up_newsletter` er fjernet igjen.

BigQuery-eksporten beviser hvorfor den gamle regelen måtte
slettes. De to `signup_newsletter`-hendelsene 23. juli manglet
`form_id` og kom fra
`http://localhost/customer/account/login?...`. De var dermed
innloggings-/ skjemahendelser i et lokalt miljø, ikke
nyhetsbrevregistreringer. Den nye regelen krever den eksplisitte
produksjonsparameteren `form_id = newsletter_signup` og kan ikke
matches av disse radene.

Google Ads API avviste både kontolisting og lesing av
konverteringshandlinger med `ACCESS_TOKEN_SCOPE_INSUFFICIENT`.
Den eksterne nettleseren ga imidlertid direkte tilgang til
Ads-konto `2842756352` som `kristoffer@utekos.no`. Et nytt
API-forsøk etter at utviklertilkoblingene ble koblet til på nytt
ga samme 403-feil mot `googleads.googleapis.com`: OAuth-tokenet
mangler fortsatt Google Ads-scope. Tilkoblet status alene er
derfor ikke bevis på brukbar Google Ads API-tilgang.

Klokken 17:19 ble den isolerte Google Ads-ADC-en autorisert på
nytt med `https://www.googleapis.com/auth/adwords` og
`https://www.googleapis.com/auth/cloud-platform`. Tokeninfo
bekreftet begge scopes uten at tokenet ble vist. Et direkte kall
til Google Ads API v25 `customers:listAccessibleCustomers`
returnerte HTTP 200 og kontoene `2842756352` og `5813203488`.
OAuth-konfigurasjonen er dermed reparert. Den globale
Codex-konfigurasjonen for `google-ads-mcp` er oppdatert med den
autoriserte ADC-banen og nødvendige kunde-, manager-, project- og
developer-tokenvariabler. De to gamle Google Ads-MCP-prosessene
ble deretter avsluttet kontrollert. Etter omstart returnerte
Google Ads-tilkoblingen begge tilgjengelige kontoer og metadata
for `conversion_action`. Et direkte kontokall bekreftet `Utekos`
(`2842756352`) med status `SUSPENDED`. OAuth-feilen er dermed
lukket; den gjenværende skriveblokkeringen skyldes
Ads-sperringen.

Konverteringslisten viser åtte aktiverte handlinger.
`Kjøp (Google Analytics-hendelse purchase)` er riktig satt til
`Primær`, men `begin_checkout`, `hero_read_more` og `add_to_cart`
ligger fortsatt aktiverte som `Primær`. De er inaktive som
datakilder, men kan fremdeles inngå i kontomål og budlogikk.
`generate_lead`, `add_to_wishlist` og `signup_newsletter` finnes
ikke i den aktive Ads-listen.

De tre utdaterte handlingene ble valgt og forsøkt fjernet samlet.
Google Ads avviste endringen med «Kontoen din er sperret. Du kan
derfor ikke utføre enkelte handlinger.» Kontoen viser samtidig
«Kontoen din er sperret – Kontoen din overholder ikke vilkårene
for Google Ads.» Ingen Ads-konvertering ble endret. Etter at
sperringen er løst, skal de tre utdaterte handlingene fjernes,
`purchase` beholdes som eneste primære netthandelsmål, og
eventuelle importer av `generate_lead`, `add_to_wishlist` og
`signup_newsletter` settes som sekundære.

Etter omstart viste Ads-kontoen to separate sperringsvarsler:

1. «Kontoen din overholder ikke vilkårene for Google Ads.»
2. «Retningslinjene for Gjenbruk av bekreftelsesidentitet brytes
   i kontoen din.»

Operatøren opplyser at den første sperringen opprinnelig ble
utløst av en Merchant Center-sperring, og at Google bekreftet
dette per e-post. Merchant Center-anken ble godkjent og Merchant
Center er aktivt, mens Ads-sperringen fortsatt står.

`Administrator > Konto` viser samtidig fullførte
verifiseringsoppgaver: organisasjonsspørsmål og Dun &
Bradstreet-informasjon ble besvart 26. mai 2026, personlig
tilknytning til organisasjonen ble bekreftet 17. juli 2026, og
annonsene er registrert som finansiert av `Kelc AS`. Den
autentiserte brukeren har også tilgang til en annen, deaktivert
Google Ads-konto (`5813203488`), og det finnes en managerkonto
(`6676193991`). Google viser ikke hvilken konto eller
verifisering som utløser påstanden om gjenbruk. Kollisjonen
mellom disse kontoene er derfor en begrunnet hypotese, ikke en
bekreftet årsak.

Den publiserte nettsiden motsier ikke den registrerte juridiske
identiteten: utekos.no viser `KELC AS`, organisasjonsnummer
`925 820 393`, samme forretningsadresse og opplyser at Utekos er
et registrert varemerke. Det er derfor ikke funnet en synlig
Utekos/Kelc-motstrid på nettstedet som forklarer
identitetssperringen.

Ads-hurtighjelpen viser fortsatt artikkelen «Problemer i Merchant
Center» også når varsel 2 av 2 om gjenbruk av
bekreftelsesidentitet er valgt. «Finn ut mer» åpner bare den
generelle artikkelen om kontosperringer og gir ingen definisjon
av den konkrete regelen. En annonseblokkeringsdialog fantes i
DOM-en under en tidligere managerøkt, men den vises ikke i den
faktiske Utekos-visningen, og det er ikke påvist noen aktiv
annonseblokkerer. Dialogen skal derfor ikke behandles som
årsaksbevis. I riktig kundekontekst som `kristoffer@utekos.no`
lastes både ankeskjemaet og reCAPTCHA. Nettleserloggen viser i
stedet en intern advarsel fra Googles Ads Support Platform om at
en rotleverandør ikke kunne injiseres. Dette er et mulig
frontendproblem hos Google, men årsakssammenhengen med den
generiske innsendingsfeilen er ikke bekreftet. Tidligere bruk av
managerinnloggingen `marketing@kelc.no` må fortsatt unngås ved
neste, ene innsending for kundekonto `2842756352`.

Hendelsesnavn som `interactwithaccordion`, `landingscrolldepth`,
`landingctaclick`, `openquickview` og `gtm.init` viser at
taksonomien er fragmentert. `gtm.init` er en intern
GTM-livssyklushendelse og skal ikke ligge som forretningshendelse
i GA4.

## Hvorfor de tre kjøpsvarslene oppstår

### 1. Google-taggen har ikke sendt `purchase` de siste 48 timene

Shopify Customer Events viser ingen Google- eller YouTube-piksel.
Kjøp kommer derfor fra serverkilder, ikke fra Google-taggen i
checkout. Varslet er korrekt: det finnes ingen bekreftet
nettleser-`purchase` som kan eie sesjon, kilde og medium.

Den robuste målarkitekturen er:

1. en samtykkestyrt Shopify Customer Event/App Pixel sender
   nettleserkjøpet;
2. nettleser- og serverkjøpet bruker samme reelle
   Shopify-transaksjons-ID;
3. Data Manager sender det autoritative serverkjøpet;
4. GA4 dedupliserer på `transactionId` på tvers av nettagg og
   Data Manager.

Dette må publiseres kontrollert, fordi en feil pixel vil gi doble
kjøp.

### 2. Measurement Protocol-kjøp mangler transaksjons-ID

I 90-dagersperioden hadde 87 av 183 `purchase`-hendelser
`transactionId = (not set)`, altså 47,5 %. Disse radene hadde
ingen inntekt eller gyldig transaksjon i GA4. I de siste åtte
dagene kom de mangelfulle radene med vert og sesjonskilde
`(not set)`, som skiller dem fra Data Manager-radene.

En ny kontroll av 24. juli styrker årsaksbeviset. GA4 viser to
gyldige transaksjoner, `shopify_order_6979906076920` og
`shopify_order_6980375576824`, samt to tomme kjøpsrader uten
transaksjons-ID, vert eller inntekt. De tomme radene ligger i
nøyaktig samme minutter som de gyldige kjøpene: 01:29 og 10:18
Europe/Oslo. Supabase viser samtidig vellykket Google-levering
for de samme to serverkjøpene klokken 23:29 og 08:18 UTC. Dette
er konsistent med at den gamle parallelle avsenderen reagerte på
samme ordrehendelser som Data Manager, men sendte ufullstendige
duplikater.

Det fantes én aktiv Measurement Protocol-hemmelighet i GA4, og
`GA_API_SECRET` lå som kryptert variabel i Vercel Production,
Preview og Development. Aktiv applikasjonskode inneholder ingen
direkte `/mp/collect`-transport. Det betyr at den defekte
avsenderen var en parallell, eldre integrasjon eller ekstern
prosess med tilgang til hemmeligheten.

Hemmeligheten er nå slettet i GA4 og `GA_API_SECRET` er fjernet
fra alle tre Vercel-miljøene. Fremtidige Measurement
Protocol-kall med den gamle nøkkelen blir dermed avvist.

Riktig løsning er å tilbakekalle hemmeligheten og fjerne
Vercel-variabelen, ikke å tilføye manglende felt til Measurement
Protocol.

### 3. Measurement Protocol-kjøp mangler brukeridentifikatorer

Den samme parallelle avsenderen sender kjøp uten gyldig
`client_id`, `user_id` eller annen akseptert identifikator. GA4
kan derfor ikke knytte kjøpet til en bruker eller sesjon og
ignorerer enkelte kjøp.

Data Manager-kjøpene har derimot gyldig transaksjons-ID,
GA-klient-ID og, når samtykket tillater det, hashbaserte
kundeidentifikatorer. I perioden fra 18. juli er 15 kjøp
bekreftet som `succeeded` og ett som `accepted_unverified` i
leveringskøen.

## Data Manager-feil som er rettet lokalt

### Ugyldig norsk underregion

144 Data Manager-hendelser fra 18. juli var dead-lettered: 131
`scroll_depth`, seks `view_promotion`, fire `select_promotion` og
tre `view_item`. Den verifiserte feilen var et ugyldig
`event_location.subdivision_code`.

Koden konstruerte verdier som `NO-07` fra et eldre, numerisk
regionfelt. Data Manager krever en reell ISO 3166-2-kode;
syntaktisk prefiksing er ikke nok. Feltet er valgfritt. Mappingen
sender nå land og by, men utelater underregion til en autoritativ
ISO-mapping finnes.

### Manglende GA-sesjons-ID

Ingen av de analyserte hendelsene fra de siste 14 dagene hadde
`ga_session_id`: 0/2 579 `page_view`, 0/2 069 `view_item`, 0/69
`add_to_cart`, 0/43 `begin_checkout` og 0/37 `purchase`. Dette
forklarer at Data Manager-kjøp med gyldig klient-ID likevel får
sesjonskilde `(not set)`.

Nettleserkoden la `gtag('get', ...)` på `dataLayer` som en vanlig
array. Den offisielle Google-taggen legger kommandoens
`arguments`-objekt på kø. Koden er rettet til den dokumenterte
formen og testet for både `client_id` og `session_id`.

### Measurement Protocol fjernet fra prosjektkonfigurasjon

`GA_API_SECRET` er fjernet fra `.env.mcp.example` og
MCP-manifestet. Prosjektinstruksen sier nå eksplisitt at
Measurement Protocol ikke skal introduseres, repareres eller
brukes som fallback.

De inaktive Vercel-variablene `GA_MP_DEBUG` og `GA_MP_VALIDATE`
er også fjernet fra Production, Preview og Development. En ny
opplisting av variabelnavn bekreftet at begge er borte. Ingen
variabelverdier ble lest eller logget.

## Shopify-piksel: publisert og koblet til

En avgrenset Shopify Customer Events-piksel og tilhørende
kontrakttest er opprettet i:

- `config/shopify/customer-events/ga4-commerce-pixel.js`;
- `config/shopify/customer-events/ga4-commerce-pixel.test.mjs`.

Pikselen er fail-closed for analysetillatelse, nekter
annonseringssamtykke, sender ingen PII, mapper
`payment_info_submitted` til `add_payment_info` og
`checkout_completed` til `purchase`, og bruker
`shopify_order_<numeric-order-id>` som transaksjons-ID. Dette er
samme format som Data Manager, slik at Google kan deduplisere
nettleser- og serverhendelsen.

Fem av fem kontrakttester består. Shopify-pikselen
`Utekos GA4 Commerce` (`160268536`) viser nå en aktiv
`Disconnect`-kontroll og en tilgjengelig testlenke. Den er dermed
lagret og koblet til. Den publiserte koden viser den forventede
Google-tag-ID-en `GT-MKRLF5WK`, sGTM-endepunktet
`https://utekos.no/__sgtm`, eksplisitt avslått annonsesamtykke,
`send_page_view: false` og fail-closed kontroll av
`analyticsProcessingAllowed`.

Shopifys personverninnstillinger er verifisert til kun
`Analytics`; `Marketing` og `Preferences` er ikke valgt.
`Data collected does not qualify as data sale` er valgt. Shopify
Pixel Helper-testlenken åpnet produksjonssiden `utekos.no` med
riktig `webPixelDebug`-kontekst. Det er ikke opprettet et
testkjøp eller sendt en kunstig betalingshendelse. Første reelle
`payment_info_submitted` og `checkout_completed` må derfor
fortsatt bekrefte henholdsvis `add_payment_info` og deduplisert
`purchase` i GA4.

En GA4 Realtime-kontroll etter tilkoblingen viste ingen
`purchase`, `add_payment_info`, `signup_newsletter` eller
`generate_lead` de siste 30 minuttene. Dagens behandlede GA4-data
viser fire `purchase`-hendelser: to gyldige transaksjoner med
samlet kjøpsinntekt på omtrent 2 864 kroner og to tomme rader
uten transaksjon eller inntekt. Dette er historikk fra før den
nye Shopify-pikselen kan produksjonsverifiseres, ikke bevis på at
pikselen har sendt sitt første kjøp.

## Meta-import: hva den brukes til, og hvorfor matchprosenten er lav

Meta-koblingen importerer kampanjekostnad, klikk og visninger.
Den importerer ikke Meta-konverteringer og den matcher ikke
personer. Matchprosenten er andelen kostnadsrader som GA4 klarer
å koble til innsamlede kampanjer på dato, `utm_source` og
`utm_medium`. `utm_campaign` og `utm_id` gir ytterligere
stabilitet og rapporteringsverdi.

Tre overlappende Meta-kilder var aktive:

| Kilde            | Match 24. juli | Problem                                                       |
| ---------------- | -------------: | ------------------------------------------------------------- |
| `Meta User Data` |        52,57 % | Misvisende navn; er kampanjedata og overlapper andre importer |
| `Meta Ads`       |        51,27 % | Beste kandidat; bruker `fb`, `ig`, `an`, `msg` / `paid`       |
| `Meta`           |        23,86 % | Facebook er feilaktig satt til `m.facebook.com` / `paid`      |

Alle tre importerer 100 % av filradene uten importfeil. Lav match
er derfor ikke en autentiserings- eller personvernfeil. Den
skyldes nøkkelbrudd:

- kostnad ligger på `fb / paid`, `ig / paid` og
  `m.facebook.com / paid`;
- inntekten ligger blant annet på `facebook / paid` og
  `fb / paid` med en blanding av kampanjenavn og numeriske
  kampanje-ID-er;
- `m.facebook.com` er et henvisningsvertsnavn, ikke en stabil
  UTM-kilde;
- tre importer konkurrerer om overlappende Meta-data.

Konsekvensen er at GA4 viser Meta-kostnad på rader med null
konvertering og null inntekt, mens konverteringsradene ofte har
null importert kostnad. ROAS blir derfor null eller misvisende
selv om både kostnad og inntekt finnes.

`Meta User Data` og `Meta` ble slettet fordi GA4 ikke tilbyr
pause eller deaktivering av disse koblingene. Den gamle
`Meta Ads`-kilden ble deretter slettet fordi source-mappingen
ikke kan redigeres etter opprettelse. GA4 har bekreftet at en ny
`Meta Ads`-kilde er opprettet med samme Meta Business Center og
annonsekonto, men med korrigert mapping:

| Meta-plattform   | Ny `utm_source` |
| ---------------- | --------------- |
| Facebook         | `facebook`      |
| Instagram        | `ig`            |
| Audience Network | tom             |
| Messenger        | tom             |
| Threads          | tom             |

Felles `utm_medium` er `paid`. Facebook-verdien følger den klart
dominerende observerte trafikken i BigQuery (`facebook / paid`: 8
072 hendelser og 1 711 brukere i tilgjengelig eksport 8.–23.
juli). Instagram beholdes som `ig` fordi dette er det eneste
observerte alternativet GA4 tilbyr for feltet og derfor
forhåndsvelger. Feltene for ubrukte plattformer står tomme, i
tråd med GA4s egen veiledning i oppsettet.

GA4 viste meldingen `Datakilden er opprettet`, og listen viser
deretter én av én datakilde. Detaljvisningen bekrefter
`facebook`, `ig` og `paid`, uten mapping for Audience Network,
Messenger eller Threads. Den manuelle kjøringen som startet 24.
juli 2026 klokken 16:51 Europe/Oslo er fullført: 100 % av 1 010
rader ble importert og null rader hadde feil. Neste planlagte
kjøring er 25. juli klokken 11:15. Matchfeltet står fortsatt som
`-`; vellykket ingest er derfor bevist, mens den nye
matchprosenten ennå ikke er behandlet. 51,27 % er siste resultat
fra den slettede mappingen og skal ikke brukes som bevis på den
nye.

## Ikke-utnyttede muligheter

- Opprett målgrupper for handlekurv uten kjøp, checkout uten
  kjøp, produkt-/kategorivisning, høy verdi og nylige kjøpere som
  ekskludering.
- Registrer forretningskritiske hendelsesparametere som
  egendefinerte dimensjoner etter en begrenset, dokumentert
  måleplan.
- Planlegg den nye, repeterbare BigQuery-kjøpskontrollen som en
  fast jobb, og utvid deretter eksporten til kohorter,
  livstidsverdi og kryssjekk mot Shopify/Supabase.
- Bygg et beslutningsklart kostnads- og inntektslag etter at
  Meta-UTM-er og transaksjonseierskap er ryddet.
- Aktiver e-post- og relevante URL-parameterredigeringer etter en
  eksplisitt personverngjennomgang.

## Endringer utført og verifisering

Kode og prosjektkonfigurasjon:

- Data Manager sender ikke lenger syntetisk `subdivisionCode`;
- Google-tagkommandoer følger den dokumenterte
  `arguments`-køformen;
- `GA_API_SECRET` er fjernet fra prosjektets MCP-maler;
- prosjektpolicyen forbyr Measurement Protocol som transport
  eller fallback;
- `ops:ga4-bigquery-readiness` kontrollerer nå de tre nyeste
  daglige eksporttabellene for manglende kjøps-ID, bruker- og
  sesjonsidentifikator, duplikater, ikke-kanoniske ID-er, inntekt
  og varer.

Testresultat:

- 52 relevante Data Manager- og GA-identifikatortester bestått;
- 6 tester for BigQuery-beredskap og kjøpskvalitet bestått;
- lint for berørte filer bestått;
- full TypeScript-kontroll ble forsøkt, men stoppes av
  eksisterende, ikke-relaterte testtypefeil i produktmetadata,
  page-view og cart-update-tester.

Produksjonsinnstillinger utført 24. juli 2026:

- Measurement Protocol-hemmeligheten `GA_API_SECRET` er slettet i
  GA4;
- `GA_API_SECRET` er fjernet fra Vercel Production, Preview og
  Development;
- `scroll`, `add_to_cart`, `begin_checkout`, `form_start` og
  `form_submit` er deaktivert som nøkkelhendelser;
- `add_to_wishlist` og `generate_lead` er aktivert av operatøren;
- `manual_event_PURCHASE`, `ads_conversion_purchase` og
  `hero_read_more` er deaktivert som nøkkelhendelser etter
  verifisert null aktivitet;
- `purchase` er verifisert beholdt som nøkkelhendelse;
- `Meta User Data`, `Meta` og den feilkonfigurerte
  `Meta Ads`-kilden er slettet; en ny `Meta Ads`-kilde er
  opprettet med `facebook / paid` og `ig / paid`, mens ubrukte
  plattformfelt står tomme;
- `GA_MP_DEBUG` og `GA_MP_VALIDATE` er fjernet fra Vercel
  Production, Preview og Development;
- event-dimensjonen `Skjema ID` (`form_id`) er opprettet;
- `signup_newsletter` er korrigert til å avledes fra
  `generate_lead` når `form_id = newsletter_signup`, og den tomme
  duplikaten `sign_up_newsletter` er fjernet;
- Shopify-pikselen `Utekos GA4 Commerce` er lagret,
  personvernkonfigurert og koblet til produksjon;
- BigQuery-datasettet `analytics_489598217` er verifisert med
  daglige `events_*`, `users_*` og
  `pseudonymous_users_*`-tabeller gjennom 23. juli;
- den repeterbare BigQuery-kontrollen gir følgende før-baseline
  for 21.–23. juli: 14 rå kjøpshendelser, 6 uten transaksjons-ID,
  0 uten brukeridentifikator, 14 uten `ga_session_id`, én
  duplisert transaksjons-ID med to ekstra rå hendelser, 7 uten
  positiv inntekt og 6 uten varer. Dette er historikk fra før
  Measurement Protocol ble tilbakekalt og Shopify-pikselen ble
  koblet til.

Google Ads-produksjonskontroll:

- `purchase` er verifisert som primær konverteringshandling;
- `begin_checkout`, `hero_read_more` og `add_to_cart` er fortsatt
  feilaktig aktiverte som primære konverteringshandlinger;
- et samlet fjerningsforsøk ble avvist fordi Ads-kontoen er
  sperret, og ingen av de tre handlingene ble endret.

GA4s tre eksisterende diagnostikkvarsler kan bli stående gjennom
neste behandlingsvindu. De skal vurderes på nytt etter at nye
hendelser er behandlet, senest etter 48 timer.

## Produksjonspakke og gjenstående arbeid

Status for den godkjente endringsøkten:

1. Data Manager- og sesjons-ID-rettingen inngår i
   produksjonsreleasen;
2. Measurement Protocol-hemmeligheten er tilbakekalt i GA4;
3. `GA_API_SECRET` er slettet fra Vercel Production, Preview og
   Development;
4. `scroll`, `add_to_cart`, `begin_checkout`, `form_start` og
   `form_submit` er deaktivert; `purchase` er beholdt; operatøren
   har aktivert `add_to_wishlist` og `generate_lead`;
5. de tre gamle, overlappende Meta-kildene er slettet, og
   `Meta Ads` er opprettet på nytt med korrigert
   Facebook-mapping;
6. `manual_event_PURCHASE`, `ads_conversion_purchase` og
   `hero_read_more` er fjernet som viktige hendelser;
7. `GA_MP_DEBUG` og `GA_MP_VALIDATE` er fjernet fra alle
   Vercel-miljøer;
8. `form_id` er registrert som egendefinert dimensjon og
   `signup_newsletter` har en presis, publisert avledningsregel;
9. en repeterbar BigQuery-kjøpskontroll er implementert og
   verifisert mot de tre nyeste daglige eksporttabellene.

Gjenstående drifts- og verifiseringsarbeid:

10. løs Google Ads-sperringen og fjern `begin_checkout`,
    `hero_read_more` og `add_to_cart` som aktive
    primærkonverteringer;
11. bekreft den nye Meta-importens første behandlede
    matchprosent, og krev stabile `utm_id`/`utm_campaign`-verdier
    ved opprettelse av nye annonser;
12. planlegg BigQuery-kjøpskontrollen som en fast jobb etter
    eksplisitt godkjenning av produksjonsplan og varslingsmål;
13. bekreft første reelle `payment_info_submitted` og
    `checkout_completed` fra den koblede Shopify-pikselen i GA4
    Realtime/DebugView;
14. overvåk Data Manager-status, GA4 Realtime/DebugView,
    manglende transaksjons-ID, sesjons-ID-dekning og Meta-match i
    minst 48 timer.

## Offisiell dokumentasjon

- [Oppgrader fra Measurement Protocol til Data Manager API](https://developers.google.com/data-manager/api/devguides/events/analytics/measurement-protocol/upgrade)
- [Feltmapping ved migrering](https://developers.google.com/data-manager/api/devguides/events/analytics/measurement-protocol/upgrade/field-mappings)
- [Send hendelser og dedupliser med transactionId](https://developers.google.com/data-manager/api/devguides/events/send-events)
- [Google tag API: get client_id og session_id](https://developers.google.com/tag-platform/gtagjs/reference)
- [GA4 BigQuery-eksportskjema](https://support.google.com/analytics/answer/7029846?hl=en)
- [Offisielle GA4 BigQuery-spørringer](https://developers.google.com/analytics/bigquery/basic-queries)
- [Importer Meta Ads-kampanjedata](https://support.google.com/analytics/answer/16536051?hl=en)
- [Om kampanjedataimport](https://support.google.com/analytics/answer/10071305?hl=en)
- [Diagnostiser mangelfulle nettkjøp](https://support.google.com/analytics/answer/16729583?hl=en)
