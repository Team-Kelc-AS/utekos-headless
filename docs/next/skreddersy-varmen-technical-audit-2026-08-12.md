# Teknisk revisjon av `/skreddersy-varmen`

Dato: 2026-08-12
Status: releasekandidat under lokal verifikasjon
Produksjonsflate: `https://utekos.no/skreddersy-varmen`

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

| Område               | Observasjon                                                                                                                     | Kilde                                                                             | Reproduksjon                                                       | Årsak                                                                                                                                | Påvirket mål                                        | Alvorlighet  | Planlagt endring                                                                                                                     | Verifikasjon                                                                                                                                                                                                                                                                                                                                                                   | Evidensgrense                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Hero/LCP             | Heroen er LCP-elementet, men initial HTML brukte `loading="lazy"` sammen med `fetchpriority="high"`.                            | PageSpeed LCP discovery insight, lokal initial DOM, Next.js 16.2.12-dokumentasjon | Kald PageSpeed og lokal Chrome på 393×852                          | Standard lazy-lasting var eksplisitt beholdt på above-the-fold-bildet                                                                | LCP og request discovery                            | P1           | Bruk dokumentert umiddelbar lasting på det valgte bildet, behold ett `<picture>` og ikke preload begge art-direction-variantene      | Lokal DOM viser `loading="eager"`, `fetchpriority="high"`, `complete=true` og én valgt mobilressurs. Preview/produksjon og ny PageSpeed gjenstår                                                                                                                                                                                                                               | Lokal dev beviser markup og valg, ikke produksjons-LCP                                                                  |
| Desktop CLS          | En kald desktopkjøring målte CLS 0,304; største rapporterte shift-node var den globale footeren                                 | PageSpeed shift cluster                                                           | Unik kald desktopkjøring                                           | Den konkrete utløsende komponenten er ikke bevist. Streamet kjøpsinnhold og tredjepartsplasseringer er kandidater, ikke konklusjoner | CLS                                                 | P1           | Ingen spekulativ `min-height`. Mål kandidat etter hero/DOM-endring på Preview og produksjon før eventuell CSS-endring                | Pågår                                                                                                                                                                                                                                                                                                                                                                          | Lighthouse peker på elementet som flyttes, ikke nødvendigvis elementet som utløser skiftet                              |
| DOM/semantikk        | Mobil- og desktopversjonen av 3-i-1-seksjonen renderte parallelle innholdstrær med dupliserte H3-er, avsnitt, ikoner og innhold | Kildekode og live DOM                                                             | Inspiser begge responsive grener og tell de tre modustitlene       | Presentasjon og innhold var kopiert per breakpoint                                                                                   | DOM-størrelse, hydration, skjermlesersemantikk      | P1           | Behold desktopens sticky bildevisning, men bruk ett felles semantisk innholdstre med responsive bilder/presentasjon                  | Lokal Chrome på 390×844, 768×1024, 1440×900 og 1920×1080 viser nøyaktig én forekomst av hver modustittel, én H1, ett `main` og ingen horisontal overflow                                                                                                                                                                                                                       | Direkte DOM-reduksjon er bevist; ytelseseffekt må måles separat                                                         |
| Kjøpskarusell        | Første slide hadde separate mobil- og desktop-`<Image>`-elementer for samme motiv                                               | Kildekode og lokal DOM                                                            | Inspiser første slide ved begge responsive grenser                 | CSS skjulte ett av to bildeelementer                                                                                                 | DOM og risiko for redundant tilgjengelighetsinnhold | P1           | Bruk ett `<picture>` med desktop-`<source>` og ett mobilfallback-bilde                                                               | Lokal DOM viser ett `<picture>` med ett `<img>` på alle fire viewporter                                                                                                                                                                                                                                                                                                        | Nettverksvalg på Preview/produksjon gjenstår                                                                            |
| Bilde-alt            | Flere informative bilder brukte modustittel eller «bilde N», og bålpannebildet hadde upresis tekst                              | Visuell inspeksjon av de faktiske assetene og kildekode                           | Sammenlign bildeinnhold med `alt`                                  | Generiske/ufullstendige beskrivelser                                                                                                 | WCAG 2.2 AA og bildebetydning                       | P1           | Presise motivbaserte beskrivelser; dekorative desktopduplikater får `alt=""`                                                         | Assetene er visuelt kontrollert; lokal DOM viser ingen synlig interaktiv kontroll uten tilgjengelig navn                                                                                                                                                                                                                                                                       | Alt-tekst beskriver verifisert motiv, ikke skjult produktpåstand                                                        |
| Metadata/JSON-LD     | Title brukte både bindestrek og tankestrek; title, description og URL var duplisert mellom metadata og JSON-LD                  | Kildekode og initial HTML                                                         | Sammenlign Metadata API-objekt og `ItemPage`                       | Flere lokale strengkilder                                                                                                            | Konsistens for søk, deling og GEO                   | P1           | Én sannhetskilde for title, social title, description og canonical URL                                                               | TypeScript passerer; initial HTML og JSON-LD valideres før release                                                                                                                                                                                                                                                                                                             | Konsistens beviser ikke rangering eller rich-result-berettigelse                                                        |
| OpenGraph            | Taggene, canonical og 1200×630 JPEG finnes; filen var omtrent 642 KB                                                            | Initial HTML, HTTP og bildekontroll                                               | Hent side og bilde som crawler                                     | Ingen dokumentert funksjonsfeil                                                                                                      | Delingsforhåndsvisning                              | P2           | Ingen kvalitetsreduserende bildeendring uten bevist gevinst                                                                          | `facebookexternalhit` får HTTP 200 for både side og JPEG; initial HTML har URL, MIME, mål og bilde-alt. Delingsdebuggerens UI er ikke verifisert                                                                                                                                                                                                                               | Crawlerrespons beviser ikke at en ekstern cache er oppdatert; filstørrelse alene er ikke en feil                        |
| JavaScript           | Mobilrapporten anslo omtrent 563,5 KB ubrukt JavaScript; egne Next-bunter, Klarna og GTM var størst                             | PageSpeed coverage/unused JavaScript                                              | Kald mobilkjøring                                                  | Både global og rutespesifikk kode inngår                                                                                             | TBT og main-thread                                  | P1           | Reduser dokumentert route-eid DOM/hydration først; ikke flytt eller forsink forretningskritiske tredjepartsskript uten kontraktbevis | Bundle-/PageSpeed-sammenligning gjenstår                                                                                                                                                                                                                                                                                                                                       | Lighthouse-estimat skiller ikke alene eierskap og faktisk brukerbehov                                                   |
| Shopify/streaming    | Ruten venter på `getTechDownCommerceViewModel()` før hovedtreet returneres; commerce er fail-closed                             | Kildekode og lokal servertrace                                                    | Kald og varm lokal request                                         | Potensiell serverventing, men produksjons-LCP-effekt er ikke bevist                                                                  | TTFB og streaming                                   | P2           | Behold modellen uendret med mindre kald produksjonstrace beviser blokkering                                                          | Ingen commerce-endring i kandidaten                                                                                                                                                                                                                                                                                                                                            | Lokal dev-cache er ikke produksjonscache                                                                                |
| Consent/tracking     | Tre isolerte samtykkeforløp er verifisert uten kodeendring                                                                      | Chrome, `dataLayer`, nettverk og Supabase read-only                               | Før valg, eksplisitt avslag og eksplisitt godkjenning              | Ingen konkret missing-, duplicate-, consent- eller payloadfeil ble funnet                                                            | Compliance og attribusjon                           | P0 ved avvik | Ingen kodeendring                                                                                                                    | Én `uc.js` med `implementation=gtm`; før valg var Cookiebot uten respons og valgfritt samtykke denied, mens Google sendte cookieless trafikk og Meta/Microsoft/Clarity ikke sendte. Avslag ga én consent-update og ingen slik providertrafikk. Godkjenning ga én update, én `page_view` og én `view_item`, der browser- og serverforsøk brukte de samme kanoniske event-ID-ene | Supabase viser aksept-/forsøksstatus og felles ID-er; dette beviser ikke Meta-deduplisering eller attribusjonsfinalitet |
| Meta Quality Ranking | Det finnes ingen annonser med effektiv status `ACTIVE` i Utekos Offisiell i kontrollert 7- eller 28-dagersvindu                 | Meta Utekos Offisiell, read-only                                                  | Hent aktive annonser i periodene 2026-08-06–12 og 2026-07-16–08-12 | Ingen aktiv annonse kan kobles til ruten                                                                                             | Annonsekvalitet                                     | P2           | Ingen endring                                                                                                                        | Providergrenen er `not_available`; dagens verktøy eksponerer heller ikke rankingfeltene                                                                                                                                                                                                                                                                                        | Sideytelse eller Dataset Quality kan ikke erstatte Quality Ranking                                                      |
| Search Console       | Den innloggede nettleserkonteksten har ikke tilgang til domeneegenskapen                                                        | Google Search Console, read-only UI                                               | Åpne egenskapen og kontroller tilgjengelighet                      | Manglende kontotilgang i kontrollert kontekst                                                                                        | Indeksering og Google-valgt canonical               | P2           | Ingen endring                                                                                                                        | Blokkert av tilgang                                                                                                                                                                                                                                                                                                                                                            | HTTP-/crawlerkontroll er ikke en erstatning for Google-valgt canonical eller siste crawl                                |

## Implementert kandidat

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

Eksakt Preview-SHA, merge og Git-utløst produksjonsdeploy
gjenstår. Produksjon må bevise alias-eierskap, sentral
metadata/DOM, hero-request, avgjørende LCP/CLS-kontroll,
runtime-logger, samtykkeforløp og read-only providergrense før
worktreen kan ryddes.
