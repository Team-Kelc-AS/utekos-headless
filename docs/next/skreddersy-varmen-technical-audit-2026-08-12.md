# Teknisk revisjon av `/skreddersy-varmen`

| Felt             | Verdi                                                         |
| ---------------- | ------------------------------------------------------------- |
| Dato             | 2026-08-12                                                    |
| Status           | Produksjonsreleaset og verifisert, med dokumenterte restavvik |
| Produksjonsflate | `https://utekos.no/skreddersy-varmen`                         |

## Dokumentasjonsstatus

Tilstrekkelig for den avgrensede implementeringen. Arbeidet er
forankret i repositoryets `AGENTS.md`, `DEPLOYMENT.md`,
`FLOW.md`, bundlet dokumentasjon for Next.js 16.2.12, dokumentert
`next/image`-atferd og offisielle providerkilder. Ingen
tracking-, GTM-, Meta-, Supabase-, Shopify- eller Klarna-kontrakt
endres.

## Låst startgrunnlag

| Felt              | Startverdi                                     |
| ----------------- | ---------------------------------------------- |
| Git-SHA           | `0f6322e1cb011b0c41e4b383a4356271c02de1a8`     |
| Vercel-deployment | `dpl_Hr6ynXXS3civ7kgXCioX5JDoNszw`             |
| Produksjonsalias  | `utekos.no`, `www.utekos.no`, `feed.utekos.no` |
| Node.js           | 24.17.0                                        |
| pnpm              | 11.17.0                                        |
| Next.js           | 16.2.12                                        |
| Branch            | `codex/skreddersy-varmen-technical-audit`      |
| Arbeidsflate      | Dedikert worktree fra fersk `origin/main`      |

Den eksakte startdeployen hadde 36 observerte HTTP 200-responser
for ruten og ingen rutespesifikke runtimefeil i den kontrollerte
perioden. Historiske feil fra andre deployer er ikke attribuert
til denne siden.

## Startmålinger

PageSpeed-tallene er laboratoriemålinger. CrUX-tallene er
feltdata og vurderes separat.

| Måling                                   |    Mobil |             Desktop |
| ---------------------------------------- | -------: | ------------------: |
| PageSpeed, median av tre kalde kjøringer |       54 |                  53 |
| LCP, median                              |    9,1 s |               1,6 s |
| CLS, median                              |    0,043 |               0,304 |
| TBT, median                              |   620 ms |              530 ms |
| CrUX LCP                                 | 2 435 ms | URL-samlet feltdata |
| CrUX CLS                                 |     0,00 | URL-samlet feltdata |
| CrUX TTFB                                |   694 ms | URL-samlet feltdata |
| CrUX FCP                                 | 2 427 ms | URL-samlet feltdata |

Variasjonen mellom laboratoriekjøringene er stor. Ingen effekt
konkluderes fra én Lighthouse-kjøring.

## Funnlogg

| Område               | Observasjon                                                                                                                     | Kilde                                                                             | Reproduksjon                                                       | Årsak                                                                                                  | Påvirket mål                                        | Alvorlighet  | Planlagt endring                                                                                                                     | Verifikasjon                                                                                                                                                                                                                                                                                                                                                                   | Evidensgrense                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Hero/LCP             | Heroen er LCP-elementet, men initial HTML brukte `loading="lazy"` sammen med `fetchpriority="high"`.                            | PageSpeed LCP discovery insight, lokal initial DOM, Next.js 16.2.12-dokumentasjon | Kald PageSpeed og lokal Chrome på 393×852                          | Standard lazy-lasting var eksplisitt beholdt på above-the-fold-bildet                                  | LCP og request discovery                            | P1           | Bruk dokumentert umiddelbar lasting på det valgte bildet, behold ett `<picture>` og ikke preload begge art-direction-variantene      | Produksjons-HTML viser `loading="eager"` og `fetchpriority="high"`. Nettverket henter én valgt heroressurs. Mobil resource delay falt fra omtrent 2 235 ms til 540 ms, men median mobil-LCP er fortsatt 6,8 s og består ikke akseptansemålet.                                                                                                                                  | Tidligere request-start er bevist; forbedringen beviser ikke alene årsak til eller løsning på hele LCP                  |
| Desktop CLS          | En kald desktopkjøring målte CLS 0,304; senere kjøringer identifiserte også den globale header-logoen uten eksplisitt størrelse | PageSpeed shift cluster                                                           | Tre kalde desktopkjøringer før og etter endring                    | Rutespesifikk utløsende komponent er ikke bevist. Det gjenstående elementet eies av global SiteChrome. | CLS                                                 | P1           | Ingen spekulativ `min-height`; ingen global headerendring i denne rutediffen                                                         | Etter median 0,026. En variabel kjøring målte fortsatt 0,304. Global header/logo er registrert som separat restfunn.                                                                                                                                                                                                                                                           | Medianen består, men kjøretidsvariasjon og et globalt element krever separat kontroll                                   |
| DOM/semantikk        | Mobil- og desktopversjonen av 3-i-1-seksjonen renderte parallelle innholdstrær med dupliserte H3-er, avsnitt, ikoner og innhold | Kildekode og live DOM                                                             | Inspiser begge responsive grener og tell de tre modustitlene       | Presentasjon og innhold var kopiert per breakpoint                                                     | DOM-størrelse, hydration, skjermlesersemantikk      | P1           | Behold desktopens sticky bildevisning, men bruk ett felles semantisk innholdstre med responsive bilder/presentasjon                  | Lokal Chrome på 390×844, 768×1024, 1440×900 og 1920×1080 viser nøyaktig én forekomst av hver modustittel, én H1, ett `main` og ingen horisontal overflow                                                                                                                                                                                                                       | Direkte DOM-reduksjon er bevist; ytelseseffekt må måles separat                                                         |
| Kjøpskarusell        | Første slide hadde separate mobil- og desktop-`<Image>`-elementer for samme motiv                                               | Kildekode og lokal DOM                                                            | Inspiser første slide ved begge responsive grenser                 | CSS skjulte ett av to bildeelementer                                                                   | DOM og risiko for redundant tilgjengelighetsinnhold | P1           | Bruk ett `<picture>` med desktop-`<source>` og ett mobilfallback-bilde                                                               | Lokal, Preview og produksjons-DOM viser ett `<picture>` med ett `<img>` på kontrollerte viewporter                                                                                                                                                                                                                                                                             | DOM-valget er bevist; det isolerer ikke alene eventuell global nettverkskostnad                                         |
| Bilde-alt            | Flere informative bilder brukte modustittel eller «bilde N», og bålpannebildet hadde upresis tekst                              | Visuell inspeksjon av de faktiske assetene og kildekode                           | Sammenlign bildeinnhold med `alt`                                  | Generiske/ufullstendige beskrivelser                                                                   | WCAG 2.2 AA og bildebetydning                       | P1           | Presise motivbaserte beskrivelser; dekorative desktopduplikater får `alt=""`                                                         | Assetene er visuelt kontrollert; lokal DOM viser ingen synlig interaktiv kontroll uten tilgjengelig navn                                                                                                                                                                                                                                                                       | Alt-tekst beskriver verifisert motiv, ikke skjult produktpåstand                                                        |
| Metadata/JSON-LD     | Title brukte både bindestrek og tankestrek; title, description og URL var duplisert mellom metadata og JSON-LD                  | Kildekode og initial HTML                                                         | Sammenlign Metadata API-objekt og `ItemPage`                       | Flere lokale strengkilder                                                                              | Konsistens for søk, deling og GEO                   | P1           | Én sannhetskilde for title, social title, description og canonical URL                                                               | TypeScript passerer; produksjonens initiale HTML og JSON-LD er validert                                                                                                                                                                                                                                                                                                        | Konsistens beviser ikke rangering eller rich-result-berettigelse                                                        |
| OpenGraph            | Taggene, canonical og 1200×630 JPEG finnes; filen var omtrent 642 KB                                                            | Initial HTML, HTTP og bildekontroll                                               | Hent side og bilde som crawler                                     | Ingen dokumentert funksjonsfeil                                                                        | Delingsforhåndsvisning                              | P2           | Ingen kvalitetsreduserende bildeendring uten bevist gevinst                                                                          | `facebookexternalhit` får HTTP 200 for både side og JPEG; initial HTML har URL, MIME, mål og bilde-alt. Delingsdebuggerens UI er ikke verifisert                                                                                                                                                                                                                               | Crawlerrespons beviser ikke at en ekstern cache er oppdatert; filstørrelse alene er ikke en feil                        |
| JavaScript           | Mobilrapporten anslo omtrent 563,5 KB ubrukt JavaScript; egne Next-bunter, Klarna og GTM var størst                             | PageSpeed coverage/unused JavaScript                                              | Kald mobilkjøring før og etter endring                             | Både global og rutespesifikk kode inngår                                                               | TBT og main-thread                                  | P1           | Reduser dokumentert route-eid DOM/hydration først; ikke flytt eller forsink forretningskritiske tredjepartsskript uten kontraktbevis | Etterrapporten anslår omtrent 564,1 KB ubrukt JavaScript. DOM-duplikatene er fjernet, men JavaScript-akseptansemålet er ikke oppnådd. De største observerte kostnadene er én egen Next-bunt, GTM, Klarna og Google tag.                                                                                                                                                        | Route-endringen reduserte DOM, men dekningstallene beviser ingen vesentlig JavaScript-reduksjon                         |
| Shopify/streaming    | Ruten venter på `getTechDownCommerceViewModel()` før hovedtreet returneres; commerce er fail-closed                             | Kildekode og lokal servertrace                                                    | Kald og varm lokal request                                         | Potensiell serverventing, men produksjons-LCP-effekt er ikke bevist                                    | TTFB og streaming                                   | P2           | Behold modellen uendret med mindre kald produksjonstrace beviser blokkering                                                          | Ingen commerce-endring i kandidaten                                                                                                                                                                                                                                                                                                                                            | Lokal dev-cache er ikke produksjonscache                                                                                |
| Consent/tracking     | Tre isolerte samtykkeforløp er verifisert uten kodeendring                                                                      | Chrome, `dataLayer`, nettverk og Supabase read-only                               | Før valg, eksplisitt avslag og eksplisitt godkjenning              | Ingen konkret missing-, duplicate-, consent- eller payloadfeil ble funnet                              | Compliance og attribusjon                           | P0 ved avvik | Ingen kodeendring                                                                                                                    | Én `uc.js` med `implementation=gtm`; før valg var Cookiebot uten respons og valgfritt samtykke denied, mens Google sendte cookieless trafikk og Meta/Microsoft/Clarity ikke sendte. Avslag ga én consent-update og ingen slik providertrafikk. Godkjenning ga én update, én `page_view` og én `view_item`, der browser- og serverforsøk brukte de samme kanoniske event-ID-ene | Supabase viser aksept-/forsøksstatus og felles ID-er; dette beviser ikke Meta-deduplisering eller attribusjonsfinalitet |
| Meta Quality Ranking | Det finnes ingen annonser med effektiv status `ACTIVE` i Utekos Offisiell i kontrollert 7- eller 28-dagersvindu                 | Meta Utekos Offisiell, read-only                                                  | Hent aktive annonser i periodene 2026-08-06–12 og 2026-07-16–08-12 | Ingen aktiv annonse kan kobles til ruten                                                               | Annonsekvalitet                                     | P2           | Ingen endring                                                                                                                        | Providergrenen er `not_available`; dagens verktøy eksponerer heller ikke rankingfeltene                                                                                                                                                                                                                                                                                        | Sideytelse eller Dataset Quality kan ikke erstatte Quality Ranking                                                      |
| Search Console       | Den innloggede nettleserkonteksten har ikke tilgang til domeneegenskapen                                                        | Google Search Console, read-only UI                                               | Åpne egenskapen og kontroller tilgjengelighet                      | Manglende kontotilgang i kontrollert kontekst                                                          | Indeksering og Google-valgt canonical               | P2           | Ingen endring                                                                                                                        | Blokkert av tilgang                                                                                                                                                                                                                                                                                                                                                            | HTTP-/crawlerkontroll er ikke en erstatning for Google-valgt canonical eller siste crawl                                |

## Implementert

- Heroens valgte art-direction-bilde lastes umiddelbart med høy
  fetch-prioritet; det er fortsatt kun ett `<img>` i `<picture>`.
- Metadata og `ItemPage` deler title, description, canonical URL
  og dato fra én kilde.
- 3-i-1-seksjonen bruker ett semantisk teksttre. Desktopbildene i
  sticky presentasjon er dekorative fordi den samme informasjonen
  står ved siden av.
- Første kjøpsbilde bruker ett `<picture>`/`<img>`-tre.
- Verifiserte informative bilder har motivbasert alt-tekst;
  heroen beholder tom alt-tekst fordi hele meningen finnes i
  synlig tekst.

## Read-only SEO-, crawler- og providerkontroll

- Hovedruten, produktsiden og den eldre
  `/skreddersy-varmen/utekos-orginal` svarer HTTP 200 til vanlig
  nettleser, Googlebot, `facebookexternalhit` og OAI-SearchBot.
- Hovedruten og produktsiden har selvrefererende canonical og
  `index,follow`. Den eldre ruten har `noindex,follow` og
  canonical til hovedruten.
- Semrush-observasjonen er fra 2026-06-15 og brukes ikke som
  sannhet om dagens metadata. Den registrerte bare «utekos» på
  posisjon 33 for URL-en.
- Siste 24 timer i det kanoniske trackinglageret inneholdt
  rutespesifikke `page_view`, `view_item`, promotion-, scroll-,
  variant- og commercehendelser. Providerforsøk var registrert
  som `succeeded` eller `accepted_unverified`; ingen slik status
  fremstilles som attribusjonsbevis.
- En naturlig samtykket produksjonssession ga ett `page_view` og
  ett `view_item`. De samme event-ID-ene ble observert i
  browserkallet og de korresponderende serverforsøkene. Meta
  Pixel initialiserte de samme ID-ene, men read-only evidensen
  stopper før providerens endelige deduplisering og attribusjon.

## Avgrensninger

Ingen nye API-ruter, schemaer, events, providerpar,
GTM-kontrakter eller Shopify-kontrakter. Ingen GTM-publisering,
Meta-mutasjon, Supabase-migrasjon, Shopify-katalogendring,
checkout-/ordretest, ny programmatisk SEO-side eller
copy-/CRO-redesign.

## Release-evidens

Lokale porter:

- `next typegen`: bestått.
- `tsc --noEmit`: bestått.
- Målrettet ESLint for alle endrede TypeScript-filer: bestått.
- 22 målrettede commerce-, page-view-, view-item- og
  Cookiebot-tester: bestått.
- Strukturert-data-validering: 13 noder, batch bestått, 0
  advarsler.
- Next.js-produksjonsbygg: bestått. Bygget logget eksisterende
  globale build-time Shopify-latensadvarsler, men ingen feil.
- `git diff --check`: bestått.
- Next DevTools: korrekt rutetre og ingen ny rutespesifikk
  appfeil. Observerte lokale Klarna-feil stammet fra en
  Chrome-utvidelses-URL og er holdt utenfor appfunnene.
- Responsiv Chrome-kontroll: bestått på 390×844, 768×1024,
  1440×900 og 1920×1080. Heroen valgte én viewporttilpasset
  ressurs med `loading="eager"` og høy fetch-prioritet; ingen
  horisontal overflow eller ikke-navngitte synlige kontroller ble
  funnet.

## Preview, PR og produksjon

- Ytelses-/semantikkendringen ble levert i PR #159, commit
  `f8ed539238edbd08eb7002be5ee0dadda85823ae`, merge-SHA
  `31a34d1e667871c7d05cfc012f2d9633ef3bda4a`.
- Eksakt Preview `dpl_BKQcR6kg2yPPaHtitvXTAJT6uXYJ` ble `READY`.
- En etterfølgende Lighthouse-kontroll fant at Klarna Express-
  wrapperen hadde `aria-label` på en generisk `div`. Den ble gitt
  dokumentert `role="group"` i PR #160, commit
  `6ee7b6a7c204ceff4c056590a9e18b49dd502021`, merge-SHA
  `b24c15924e85b00f6df35fefb54cf62900cdf27f`.
- Eksakt Preview `dpl_6HzUkicdgZiz9FWrhwyw1LoRFsSa` ble `READY`
  og den nye grupperollen ble kontrollert i DOM.
- Endelig Git-utløst produksjonsdeploy
  `dpl_6oGdjx3VxcKwpEckCgYHSAZDhXtx` er `READY`, har eksakt
  merge-SHA `b24c15924e85b00f6df35fefb54cf62900cdf27f` og eier
  `utekos.no`, `www.utekos.no` og `feed.utekos.no`.
- Eksakt deployment hadde 16 observerte HTTP 200-responser og fem
  202-responser i kontrollvinduet, uten error-, warning- eller
  fatal-logger.

## Produksjonsmålinger

| Måling                                   | Mobil før | Mobil etter | Desktop før | Desktop etter |
| ---------------------------------------- | --------: | ----------: | ----------: | ------------: |
| PageSpeed, median av tre kalde kjøringer |        54 |          69 |          53 |            78 |
| LCP, median                              |     9,1 s |       6,8 s |       1,6 s |         1,3 s |
| CLS, median                              |     0,043 |       0,043 |       0,304 |         0,026 |
| TBT, median                              |    620 ms |      350 ms |      530 ms |        390 ms |

Fersk mobiltrace viser heroen i initial HTML, `loading="eager"`,
høy prioritet, én valgt request og ingen dobbel
mobil-/desktoplast. Resource delay falt med omtrent 1,7 sekunder.
Gjenværende LCP-tid ligger hovedsakelig etter request-start, og
mobilmålet på 2,5 sekunder er ikke nådd. Fersk mobilrapport hadde
93 requests, cirka 2,13 MB overført og omtrent 564,1 KB estimert
ubrukt JavaScript. Dette er et åpent P1-funn, ikke en skjult
bestått port.

Desktopmedianen består LCP- og CLS-målene. En av tre
desktopkjøringer hadde fortsatt CLS 0,304, mens de to andre hadde
0,026. Lighthouse pekte på den globale header-logoen som et
element uten eksplisitt størrelse. Global SiteChrome er ikke
endret i denne rutediffen.

Produksjons-HTML og DOM har én title, én canonical, én H1, ett
`main`, norsk språk, konsistente OpenGraph-/Twitter-data, gyldig
JSON-LD, tre unike modustitler og ett bilde i første kjøpsslide.
Heroen henter én viewporttilpasset ressurs. OpenGraph-siden og
1200×630-bildet returnerer HTTP 200 til `facebookexternalhit`.

PageSpeed-resultatet for accessibility er 0,97; best practices og
SEO er 1,00. Den rute-eide ARIA-feilen er rettet. Gjenværende
kontrastfeil gjelder to lenker i Cookiebot-dialogen («Samtykke»
og «9 third parties») og krever en separat
CMP/GTM-konfigurasjonsendring.

## Samtykke- og eventevidens

Tre isolerte produksjonsforløp ble kontrollert:

1. Før valg: én `uc.js` med `implementation=gtm`, default-denied,
   dokumentert Google cookieless-trafikk og ingen Meta-,
   Microsoft- eller Clarity-trafikk.
2. Avslag: én `cookie_consent_update`, valgfrie kategorier avvist
   og ingen slik providertrafikk.
3. Godkjenning: én consent-update, ett `page_view` og ett
   `view_item`, uten duplisert pageview i den kontrollerte
   sesjonen.

Den naturlige produksjonssesjonen brukte event-ID
`659c6e66-b246-4e33-a7ec-70b5afe33ddf` for `page_view` og
`a3298252-b3dc-46f6-96b5-8c958e021149` for `view_item`, med
felles `page_view_id` `b1fc7179-fb98-41d2-926f-25e0b3552c5a`.
Supabase read-only viste de samme kanoniske ID-ene og
`accepted_unverified`-forsøk for relevante providerpar. Meta
Pixel initialiserte og sendte `PageView`/`ViewContent` med de
samme event-ID-ene. Evidensen stopper ved providerforsøk og
observerte browser-ID-er; endelig Meta-deduplisering og
attribusjon er ikke bevist.

## GEO-observasjon

Dette er ikke-deterministiske punktobservasjoner, ikke en
rangeringstest:

- Verken ChatGPT eller Gemini nevnte Utekos i det generiske
  settet om terrasse, bålpanne, hytte, camping og bobil. ChatGPT
  nevnte blant annet lag-på-lag, Mill, Heat Experience, Devold,
  Røros Tweed, Espegard, Jøtul, Therm-a-Rest, Helsport, Truma og
  Alde. Gemini brukte andre generiske kategorier og kilder.
- Ved direkte spørsmål om Utekos TechDown fant begge assistentene
  produktet og oppga produktsiden som beste offisielle kilde.
  Begge lenket også til sammenligningsguiden og
  `/skreddersy-varmen`.
- Gemini blandet i svaret skrivemåten CloudWeave™ med CloudWave™.
  Dette viser at AI-observasjonen må behandles som en usikker
  representasjon, ikke som autoritativ produktdata.

## Akseptanse og åpne grenser

| Akseptansepunkt                                    | Status                              |
| -------------------------------------------------- | ----------------------------------- |
| Én heroressurs, eager/high og tidligere oppdagelse | Bestått                             |
| Desktop median LCP ≤ 2,5 s og CLS ≤ 0,1            | Bestått                             |
| Mobil median LCP ≤ 2,5 s                           | Ikke bestått                        |
| Mobil CLS ≤ 0,1                                    | Bestått                             |
| Redusert route-eid ubrukt JavaScript               | Ikke bevist / ikke bestått          |
| Én H1, ett `main`, canonical, OG og gyldig JSON-LD | Bestått                             |
| Ingen nye rutespesifikke runtimefeil               | Bestått                             |
| WCAG 2.2 AA uten kontrastavvik                     | Blokkert av Cookiebot-konfigurasjon |
| Search Console / Google-valgt canonical            | Blokkert av kontotilgang            |
| Meta Quality Ranking for aktiv annonse til ruten   | `not_available`                     |

Det ble ikke gjort GTM-publisering, Meta-mutasjon,
Supabase-migrasjon, Shopify-katalogendring eller
betalings-/ordretest. Commerce-request-/purchasekjeden ble ikke
endret, og den obligatoriske produksjonsgaten for cart/checkout
ble derfor ikke utløst.
