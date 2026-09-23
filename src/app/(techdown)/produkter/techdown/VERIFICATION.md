# TechDown-karusell – lokal verifisering

## Oppfølging: miniatyr 6 og avrunding

23. september 2026: røde/grønne fargeflekker ble bekreftet direkte i Downloads/TechDown_64x64/6.jpg (og den uendrede prosjektkopien), før Next.js-optimalisering. Den opprinnelige eksportårsaken er ikke fastslått. En separat, AI-korrigert miniatyr er lagret som images/thumbnails/6-corrected.jpg (64 × 64, 2 132 bytes), og manifestet peker nå på den. Originalene er bevart. Korreksjonen brukte innebygd image_gen med originalminiatyren som mål og det rene hovedbildet 6.webp som fargereferanse; dette er ikke en påstand om pikselidentisk restaurering. Hovedbildet er uendret.

Prompt: Remove only the erroneous red/magenta and greenish patches in the navy garments; use the matching main image as color/product reference; preserve the thumbnail's square composition, people, poses, clothing, objects and background; no crop, padding, stretch, zoom, text or new scene. Resultatet ble visuelt kontrollert og skalert proporsjonalt til 64 × 64 uten beskjæring.

Galleriflaten, hovedbildene og miniatyrknappene bruker nå rounded-lg; thumbnail-bilder og valgt-markering arver avrundingen. Prosjektets token gir 10 px radius. Målrettet ESLint og TypeScript bestått etter endringen. Målingene nedenfor gjelder den opprinnelige leveransen før denne oppfølgingen.

Kontrollert 23. september 2026 på main, Next.js 16.3.1 / Node 24.17.0. Ingen publisering, commit eller endring av global konfigurasjon. Eksisterende arbeidsendringer er bevart.

## Implementasjon

- 16 eksplisitte par i `techdownImages.ts`: n.jpg → n.webp, numerisk rekkefølge.
- Alle 32 kopier er kontrollert byte-for-byte mot Downloads. Ingen kilder er slettet eller konvertert.
- Alle par er visuelt gjennomgått; alternativtekst beskriver hovedbildet.
- Hovedflate 2:3 med contain, miniatyrer 64 × 64 CSS-piksler, gap 8 px, avstand 12 px, sideinnrykk 24 px. Bilde 12/13 beholder originalene 1875 × 2813, øvrige 1000 × 1500. Transparens beholdes for 11–13.
- `next/image` brukes direkte, uten MDX-regelen for kvadratiske bilder. Statiske importer gir innholdshash og dimensjoner.
- Første hovedbilde SSR-rendres med eager/high, kvalitet 80 og sizes calc(100vw - 48px). Neste hovedbilde lastes med lav prioritet etter det aktive bildet. Miniatyrer er lazy, kvalitet 75, sizes 64px.
- Native horisontal scroll snap, IntersectionObserver, ResizeObserver med opprydding. Ingen ny karusellpakke eller globale lyttere for touchmove/scroll.
- Galleriet er utenfor viewport-gaten. Header, cart providers, CTA og telemetri er fortsatt mobilgated. Intro og inngangssekvens er beholdt. Synlig overskrift er fjernet; H1 finnes skjult for skjermlesere.

## Funksjonskontroller

Playwright CLI / Chromium med syntetiske touch-hendelser, både utviklingsmodus og lokal produksjonsmodus. Dette er ikke en test på fysisk iPhone/Android eller Safari/WebKit.

| Viewport | Hovedflate | Miniatyrer |
| --- | --- | --- |
| 320 px | 272 × 408 px | 64 × 64 px |
| 360 px | 312 × 468 px | 64 × 64 px |
| 375 px | 327 × 490,5 px | 64 × 64 px |
| 390 px | 342 × 513 px | 64 × 64 px |
| 430 px | 382 × 573 px | 64 × 64 px |
| 767 px | 719 × 1078,5 px | 64 × 64 px |

- 16/16 bildevalg kontrollert, inkludert 9 → 10. Markering, aktivt hovedbilde og scrollposisjon samsvarer.
- Direkte 1 → 16 gir bare hovedbilder 1, 2 og 16, ikke 3–15.
- Valgt miniatyr er helt synlig. Breddeendring realignerer både hovedflate og miniatyrrad.
- Touch-sveip på hovedflaten velger bilde 2. Touch-sveip flytter miniatyrraden. Vertikal touch-scrolling over hovedbildet fungerer.
- Piltaster, Home, End og siste-bilde-grense kontrollert. Knapper har navn, aria-pressed, fokusmarkering og teller med høflig annonsering. Ingen autoplay/loop/zoomfunksjon.
- Rotasjon emulert til 667 × 390 uten tap av snap-posisjon.
- Ved 390 × 600 og maksimal vertikal scroll sluttet miniatyrraden ved y=471, mens CTA startet ved y=512: 41 px klaring.
- 768 px omdirigerer til /produkter/utekos-techdown. Redusert bevegelse hopper over introen.
- Tvunget nettverksfeil for bilde 16 gir nytt-forsøk-knapp; nytt forsøk laster bildet. Flaten endrer ikke dimensjoner.
- De nøyaktige statiske hovedbildefilene 11–13 ble identifisert byte-for-byte mot originalene, hentet gjennom produksjonens Image Optimizer og kontrollert med sharp: AVIF-responsene beholder alfakanalen.
- JavaScript deaktivert: nøyaktig ett hovedbilde finnes i HTML og lastes ferdig med eager/high. Ingen hydrering kreves for bildeoppdagelsen.
- Ingen JavaScript-pageerrors i isolerte ytelses-/feiltester. Ingen nye Instant-/hydrering-feil observert på dev-ruten etter fjerning av `instant = false`.

## Ytelse

Lokal produksjonsserver, Chromium, DPR 2, 1,6 Mbit/s ned, 750 kbit/s opp, 150 ms forsinkelse, uten CPU-throttling. Enkeltmålinger er laboratorieobservasjoner, ikke feltdata eller garantier for Vercel/CDN.

| Måling | 390 px, kald nettleser | 430 px, kald nettleser og kald bildeoptimalisering | 430 px, varm nettleser |
| --- | --- | --- | --- |
| Valgt bredde, hovedbilde 1 | 750 px | 828 px | 828 px |
| Format / faktisk bildestørrelse | AVIF / 31 073 bytes | AVIF / 35 069 bytes | AVIF / cache |
| Forespørsel startet | 179 ms | 185 ms | 196 ms |
| Hovedbilde overført ferdig | 689 ms | 718 ms | 196 ms |
| Samlede innledende galleribildebytes over nett | 80 085 | 88 405 | 0 |
| CLS gjennom lasting og valg | 0 | 0 | 0 |
| Direkte valg av bilde 16 til ferdig lastet | 612 ms | 563 ms | 65 ms |
| Intro borte | 8,04 s | 8,03 s | 3,39 s |
| Header/CTA ferdig inn | 8,71 s | 8,70 s | 4,05 s |

Første hovedbilde hadde parser som initiator og High nettverksprioritet, bilde 2 Low. Første bilde ble overført rundt 2,8 sekunder før mobil-/introhydreringen i kald test. Bare hovedbilder 1 og 2 var montert før bildevalg.

Nettleserens native lazy-loading hentet 14 små miniatyrer nær visningsflaten i kald test, og 16 fra varm cache. Lazy er en nettleserheuristikk, ikke en garanti om bare helt synlige miniatyrer. Kildene er kun 64 × 64; DPR 2 velger optimizerparameter w=128, men dette skaper ikke ekstra ekte detaljer.

430 px-testen observerte `x-nextjs-cache: MISS` på begge hovedbilder. Etterfølgende uavhengig HTTP-kontroll av samme 828 px hovedbilde ga HIT, AVIF, 35 069 bytes og immutable cache-header. I varm nettleser kan den opprinnelige MISS-headeren være gjenbrukt fra nettlesercache; den betyr ikke en ny serverkonvertering.

Introens synlige ventetid må vurderes separat: kald JavaScript-oppstart tok omtrent 3,5 sekunder, deretter utløste eksisterende 4,5-sekunders introgrense og 650 ms headeranimasjon. Bildeforbedringen fjerner ikke denne avtalte skjermingen.

## Bygg og avgrensninger

- Målrettet ESLint: bestått.
- `pnpm exec tsc --noEmit`: bestått.
- `git diff --check`: bestått for sporede endringer.
- `pnpm exec next build`: bestått også etter siste miniatyrrad-retting, 173 sider generert. Ruten er statisk prerenderet.
- `pnpm run build`: stoppet i eksisterende prebuild-kontroll med «Generated canonical manifest drift» for contracts/events/canonical-event-manifest/v1/canonical-event-manifest.v1.schema.json. Ingen sporingsmanifestfiler ble endret for å omgå kontrollen.
- Lokale produksjonskall til telemetri fikk HTTP 403. Serverloggen bekrefter «browser event rejected: bad origin» for http://127.0.0.1:3001, og logget også generiske client.error-hendelser under denne kjøringen. Ett page-view/capture-forsøk per innlasting ble observert, også ved bildevalg. Dette bekrefter ikke mottak/deduplisering hos produksjonsleverandører. Checkout, betaling og øvrige handelsflyter er ikke gjennomført.
- Eksisterende miljøvarsler: lokal Vercel Runtime Cache bruker minnecache, QueueClient faller tilbake til iad1, og forhåndslastede fonter kan være ubrukte på ruten. Disse globale forholdene er ikke endret.
- Ingen endring av next.config.mts: AVIF/WebP, qualities, breddekandidater, cacheComponents/cacheLife, partialPrefetching, React Compiler, inlineCss, MDX/Workflow/analyseinnpakning, redirects og rewrites er videreført.

## Dokumentasjon og bevis

Implementeringen følger oppdatert dokumentasjon innhentet via Context7/Exa/Vercel samt installerte Next.js 16.3.1-dokumenter:

Next.js- og Vercel React-skillene ble brukt til å avgrense klientkontrolleren og unngå en ekstra karusellavhengighet. Playwright-skillen styrte CLI-verifiseringen. Brand-reglene styrte bevaring av originalenes komposisjon, transparens, produktvariant og eksisterende merkeelementer; ingen nye bildefiler ble generert.

- [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js MDX](https://nextjs.org/docs/app/guides/mdx)
- [Instant navigation](https://nextjs.org/docs/app/guides/instant-navigation)
- [Vercel Image Optimization](https://vercel.com/docs/image-optimization)
- [CSS scroll snap](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll_snap)

Lokale måledata og gjenkjørbare CLI-scenarier ligger i output/playwright/techdown-*.js og techdown-*-results.json. Bildet techdown-390.png viser mobiloppsettet. Output-mappen er lokal testdokumentasjon, ikke en publisert leveranse.

## Oppfølging 2026-09-23: tomme bilder etter bilde 8

- Reprodusert i brukerens in-app-nettleser på localhost:3000, 418 px bredde: bilde 9–14 var montert med gyldige `src`/`srcset`, men hadde `complete=false`, `naturalWidth=0` og tom `currentSrc`. Teller og scrollposisjon kunne gå videre; dette var ikke en grense på åtte lysbilder.
- Den eksakte optimizerforespørselen for bilde 9, `w=750&q=80`, svarte som WebP med HTTP 200 på 85 ms. Med `Accept: image/avif` ga samme URL ingen responsbytes innen 15 sekunder. AVIF i bredde 828 og kvalitet 80 samt bredde 750 og kvalitet 85 svarte med HTTP 200 på henholdsvis 227 og 180 ms. Separat Sharp-konvertering av original 9 til AVIF tok 68 ms. Ingen ferdig diskcacheoppføring fantes for varianten som hang.
- Den lokale Next.js-utviklingsserveren ble startet på nytt, uten sletting av cachefiler eller endring av next.config.mts, bildefiler eller karusellkode. Etter omstart svarte tidligere fastlåst AVIF-variant med HTTP 200, 27 829 bytes; etterfølgende cachetreff tok 2 ms. Dette avgrenser den observerte feilen til lokal server-/forespørselstilstand. Den interne utløsende årsaken er ikke bevist, og omstarten er ikke dokumentasjon på en permanent framework-retting.
- Brukerens in-app-nettleser: horisontal scrolling gjennom 1 → 16 → 1, med ferdig dekodet bilde på hvert trinn. Bilde 16 kontrollert visuelt; nettleseren etterlatt på bilde 1.
- Separat Chromium-kjøring med `output/playwright/techdown-sequential-swipe.js`: 30 native, emulerte touch-sveip gjennom 1 → 16 → 1. Hvert trinn kontrollerer aktiv slide, korrekt snap-posisjon, `complete=true` og `naturalWidth>0`. Bestått, 0 konsollfeil. Denne testen utvider den tidligere enkelt-sveip-testen; tidligere 16/16-kontroll gjaldt miniatyrtrykk.
- Ingen applikasjonskode ble endret i denne feilrettingen. Derfor ble ikke produksjonsbygg/typekontroll kjørt om igjen. Ingen deploy; fysisk iPhone/Safari er fortsatt ikke verifisert.
