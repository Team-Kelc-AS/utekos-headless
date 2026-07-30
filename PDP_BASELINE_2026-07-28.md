# PDP-baseline og ytelsesbudsjett (KRI-6)

Historisk før-måling for server-first-refaktoreringen av
produktsiden (KRI-5). Ingen produksjonskode er endret i denne
saken.

> Revidert 2026-07-30: Den opprinnelige harnessen merket alle
> `next-action`-requests som autoritative produktrefetcher, kalte
> samlet ressursvarighet for «script evaluation», og målte
> klientnavigasjonen til `techdown-variant` uten å navigere til
> `?variant=`. Disse tre påstandene er korrigert i verktøyet. De
> historiske labtallene under er derfor kontekst, ikke en låst
> etter-målingsreferanse. Kjør en ny `baseline-v2` med minst tre
> samples før KRI-11.

> Statisk guardrail revidert 2026-07-30:
> `scripts/pdp/baseline.json` ble først re-seedet fra
> produksjonscommit `cb44ec3` etter PR #88. Tre nye
> cart-sikkerhetsmoduler gir omtrent +2,8 KiB netto i
> klientgrafen. KRI-19-kandidaten `c18cd86e3` flytter det
> eksisterende `product-query-client`-bruddet til den delte
> `makeQueryClient`-helperen og reduserer klientkildene med 48
> bytes. Boundary entry points, tredjepartspakker og antallet
> seks kjente PDP-brudd er uendret. De historiske
> browsermålingene og ytelsesbudsjettene under er ikke endret.

## Miljø

| Felt                  | Verdi                                                                           |
| --------------------- | ------------------------------------------------------------------------------- |
| Commit SHA (baseline) | `9a6452c46683a5017499c115534b9b568246b1c5`                                      |
| Målt mot              | `https://utekos.no` (produksjon), deployment `dpl_7yPRTqU24qoGF8rT6TEPvqP2Mm3M` |
| Dato                  | 2026-07-28                                                                      |
| Next.js / React       | 16.2.9 / 19.2.7 (Cache Components på)                                           |
| Verktøy               | `scripts/perf/measure-pdp-baseline.mjs`, Playwright Chromium 149 headless shell |
| Viewport              | 1440×900                                                                        |
| CPU-throttling        | 4×                                                                              |
| Samples               | 3 per rute per modus, median rapportert                                         |
| Hydration-vindu       | 5 000 ms etter `load`                                                           |

Måleharnesset er sjekket inn og kan brukes som etter-måleverktøy
for KRI-11 etter at en korrigert `baseline-v2` er lagret med
samme versjon av scriptet.

```bash
node scripts/perf/measure-pdp-baseline.mjs --runs=3 --label=baseline
# → output/perf/pdp-baseline.json
```

### Målemetode

- **Payload måles på serverresponsen**, ikke på hydrert DOM.
  RSC-strømmen rekonstrueres fra
  `self.__next_f.push`-bootstrapskriptene. Dette er det som gjør
  tallene sammenlignbare før/etter.
- **Overførte bytes** hentes fra
  `request.sizes().responseBodySize` (bytes på tråden).
  `response.body()` er allerede dekomprimert og brukes til
  ukomprimert størrelse.
- **Rutespesifikk JavaScript** er definert som chunks lastet på
  PDP som _ikke_ lastes på `/produkter`, målt med separat
  browserkontekst per rute for å unngå HTTP-cachegjenbruk.
- **Server Action-requests** identifiseres med
  `next-action`-headeren. Headeren alene identifiserer ikke
  hvilken action som ble kalt, så harnesset rapporterer ikke
  lenger dette som en autoritativ produktrefetch uten separat
  korrelasjon mot action-manifest eller serverinstrumentering.
- Nyhetsbrevmodalen undertrykkes eksplisitt i den isolerte
  browserkonteksten, slik at den ikke blokkerer produktlenken
  eller forurenser labmålingen.
- Consent-dialogen fanger pointer events på produktgriden, så
  klientnavigasjon avviser Cookiebot før klikk.

**Varians:** payload-metrikkene er deterministiske — dehydrert
state og flight-strøm reproduserte identisk over alle kjøringer.
Lab-metrikkene er det ikke. Enkeltkjøringer mot produksjon ga
observerte utliggere på LCP 7728 ms og CLS 0,3 der medianen er
1684 ms / 0,0028, forårsaket av tredjepartslast som ikke rakk å
fullføre innenfor måletvinduet. **Kjør alltid `--runs=3` eller
mer og sammenlign medianer.** En enkelt kjøring er ikke gyldig
bevis for LCP, TBT eller CLS.

## Referanseruter

| ID                 | Rute                                                                             |
| ------------------ | -------------------------------------------------------------------------------- |
| `techdown-plain`   | `/produkter/utekos-techdown`                                                     |
| `techdown-variant` | `/produkter/utekos-techdown?variant=gid://shopify/ProductVariant/46944403882232` |
| `comfyrobe`        | `/produkter/comfyrobe` (enklere variantsett)                                     |

## Resultater — hard reload

| Metrikk                          | techdown-plain | techdown-variant | comfyrobe    |
| -------------------------------- | -------------- | ---------------- | ------------ |
| HTML overført (gz)               | 40,6 KiB       | 40,5 KiB         | 39,8 KiB     |
| HTML ukomprimert                 | 387,6 KiB      | 387,8 KiB        | 373,1 KiB    |
| RSC flight-strøm                 | 155,6 KiB      | 155,8 KiB        | 151,3 KiB    |
| **Dehydrert TanStack-state**     | **17,5 KiB**   | **17,5 KiB**     | **13,0 KiB** |
| Dehydrerte produktqueries        | 1              | 1                | 1            |
| Unike variant-GID-er i payload   | 14             | 14               | 14           |
| `bridgeFor`-metaobjektreferanser | 14             | 14               | 14           |
| Nettverkskall totalt             | 118            | 118              | 118          |
| Kall til eget origin             | 98             | 98               | 98           |
| Førsteparts JS overført          | 1 240 KiB      | 1 240 KiB        | 1 240 KiB    |
| Førsteparts JS ukomprimert       | 4 050 KiB      | 4 050 KiB        | 4 050 KiB    |
| Tredjeparts JS overført          | 765 KiB        | 765 KiB          | 765 KiB      |
| RSC-prefetch (18 kall)           | 77,5 KiB       | 79,8 KiB         | 80,0 KiB     |
| **Server Action-requests**       | **0**          | **0**            | **0**        |
| LCP                              | 1 684 ms       | 1 736 ms         | 1 848 ms     |
| CLS                              | 0,0028         | 0,0028           | 0,0028       |
| TBT                              | 865 ms         | 982 ms           | 836 ms       |
| Long-task-tid                    | 1 629 ms       | 1 782 ms         | 1 636 ms     |
| Script-resource-varighet         | 3 579 ms       | 6 927 ms         | 3 696 ms     |
| Hydration-/Suspense-advarsler    | 0              | 0                | 0            |
| Konsollfeil                      | 0              | 0                | 0            |

Dokumentcache ved måling: `x-vercel-cache: HIT`,
`x-nextjs-stale-time: 300`.

## Resultater — klientnavigasjon

Fra `/produkter` via lenkeklikk. Bare selve transisjonen er
instrumentert. `techdown-variant` er fjernet fra denne modusen
fordi produktlisten ikke har en lenke med `?variant=`; den
historiske raden målte i realiteten samme destinasjon som
`techdown-plain`.

| Metrikk                          | techdown-plain | comfyrobe     |
| -------------------------------- | -------------- | ------------- |
| RSC-payload for ruten            | 11,4 KiB       | 13,3 KiB      |
| Nettverkskall                    | 51             | 51            |
| **Rutespesifikk JS overført**    | **258,0 KiB**  | **258,0 KiB** |
| **Rutespesifikk JS ukomprimert** | **845,2 KiB**  | **845,2 KiB** |
| Server Action-requests           | 0              | 0             |
| CLS                              | 0,0028         | 0,0028        |
| TBT etter transisjon             | 328 ms         | 334 ms        |
| Long-task-tid                    | 678 ms         | 684 ms        |

Rutespesifikk JS = 13 chunks som lastes på PDP men ikke på
`/produkter`. Største enkeltchunk er 111 KiB overført / 433 KiB
ukomprimert.

## Verifiserte funn

### 1. Ingen Server Action-request ble observert etter mount — mekanismen står der

Issuet antar autoritativ produktrefetch i browseren.
Nettverksmålingen fant **0 Server Action-requests**, også etter
130 s med `visibilitychange`- og `focus`-sykluser. Det er
konsistent med ingen produktrefetch i vinduet, men
`next-action`-headeren alene kan ikke bevise action-identitet.

Årsaken er at `dehydrate()` serialiserer `dataUpdatedAt` fra
rendertidspunktet, og `staleTime: 60_000` i
[`makeQueryClient.ts`](https://github.com/Team-Kelc-AS/utekos-headless/blob/9a6452c46683a5017499c115534b9b568246b1c5/src/api/lib/makeQueryClient.ts)
regner queryen som fersk. Ingen komponent kaller `refetch()` på
mount.

Dette er en **latent, ikke aktiv** kostnad. `getProductAction` er
fortsatt koblet som `queryFn` i
[`productOptions.ts`](https://github.com/Team-Kelc-AS/utekos-headless/blob/9a6452c46683a5017499c115534b9b568246b1c5/src/api/lib/products/productOptions.ts),
og `useProductPageData` eksponerer `refetch`. En endring i
`staleTime`, et `refetchOnMount`, eller en `invalidateQueries`
som treffer `['products', …]` vil aktivere en full produkthenting
over Server Action. Nettverksobservasjonen alene er ikke nok til
å erklære produktrefetch-målet oppfylt; budsjettet må formuleres
som _0 muligheter_ i den statiske grafen, ikke bare _0 observerte
Server Action-requests_.

### 2. Dehydrert produktquery: 17,5 KiB per PDP-visning

`AsyncProductContent` gjør
`queryClient.setQueryData(['products', handle], product)` og
dehydrerer hele produktobjektet inn i RSC-payloaden. Målt
`queryHash`: `["products","utekos-techdown"]`.

17,5 KiB av 155,6 KiB flight-strøm = **11,3 % av RSC-payloaden**
brukes til en query som ingen leser autoritativt, siden det samme
produktet også sendes som props gjennom `ProductPageController`.
Produktdata serialiseres altså to ganger i samme respons.

### 3. Fire separate `getProduct(handle)`-lastinger per PDP-render

| Kallsted                      | Cachewrapper          | `cacheLife` | `cacheTag`          |
| ----------------------------- | --------------------- | ----------- | ------------------- |
| `getCachedProductForMetadata` | `'use cache'`         | _default_   | **mangler**         |
| `ProductJsonLd`               | `'use cache'`         | `max`       | `product-${handle}` |
| `ProductBreadcrumbJsonLd`     | `'use cache'`         | `max`       | `product-${handle}` |
| `getCachedProductPageData`    | `'use cache: remote'` | `products`  | `product-${handle}` |

`getProduct` er selv `'use cache: remote'` med
`cacheLife('products')`, så Storefront-kallet dedupliseres. Men
hver av de fire wrapperne **lagrer sin egen kopi av hele
produktgrafen** i sin egen cacheoppføring, med fire ulike
freshness-profiler, og kjører `reshapeProductWithMetafields` på
nytt.

To konkrete konsekvenser:

- `getCachedProductForMetadata` mangler `cacheTag`, så metadata
  blir **ikke** invalidert av
  `revalidateTag('product-<handle>')`. Pris/tilgjengelighet i
  `<meta>` kan divergere fra sideinnholdet.
- JSON-LD-trærne bruker `cacheLife('max')` mot `products` (stale
  300 s) for sideinnholdet. Strukturert pris kan bli eldre enn
  synlig pris.

### 4. `fetchProductOptions` er ucachebar per request

[`fetchProductOptions`](https://github.com/Team-Kelc-AS/utekos-headless/blob/9a6452c46683a5017499c115534b9b568246b1c5/src/api/lib/products/fetchProductOptions.ts)
kjører med `cache: 'no-store'` og uten `use cache`. Kombinert med
`await connection()` i `page.tsx` betyr det **ett
Storefront-rundturkall per PDP-request**, også ved cache HIT på
dokumentet — og på nytt ved hvert variantbytte, siden
`useVariantSelection` gjør `router.replace`.

### 5. Hydrogen React og TanStack Query er i klientbundelen

`flattenConnection` er verifisert i fire PDP-klientchunks (via
`useVariantSelection` og `useLocalVariantSelection`). TanStack
Query-runtime ligger i fire chunks.
`getProductOptions`/`getAdjacentAndFirstAvailableVariants` ble
**ikke** funnet klientside — de brukes korrekt bare på server.

### 6. Ingen hydration-advarsler eller CLS-problem i utgangspunktet

0 hydration-/Suspense-advarsler og 0 konsollfeil på alle ruter.
CLS er 0,0028 overalt — praktisk talt null. **CLS har ingen
headroom å hente; kravet er ren regresjonsbeskyttelse.**

### 7. `await connection()` gjør PDP fullt dynamisk

`page.tsx` kaller `await connection()`, som opphever prerendering
til tross for `generateStaticParams`. `/produkter/comfyrobe`
svarte `x-vercel-cache: PRERENDER` ved første kontakt, men
techdown-rutene er `HIT` på runtime-cache, ikke statisk
prerender. Dette hører til KRI-12 (Cache Components/PPR) og bør
ikke løses i KRI-7…KRI-10 uten koordinering.

## Buildgater

| Kommando         | Resultat                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| `pnpm typecheck` | **Grønn** — krever `pnpm exec next typegen` først; uten det feiler ~19 `@public/*`-moduler |
| `pnpm lint`      | **Grønn**, 0 funn                                                                          |
| `pnpm build`     | **Blokkert** — `generateStaticParams` feiler uten Storefront-credentials                   |
| `pnpm analyze`   | **Blokkert** — se under                                                                    |

`pnpm analyze` = `cross-env ANALYZE=true next build`, men
`@next/bundle-analyzer` er installert (`package.json:279`) og
**aldri koblet inn i `next.config.mts`**. `ANALYZE` finnes ikke i
konfigurasjonen, ingen `withBundleAnalyzer` i wrapperkjeden
(`withSentryConfig(withBotId(withMDX(nextConfig)))`), og ingen
`.next/analyze`-artefakter produseres. Kommandoen er i praksis en
vanlig build.

Fordi analyzer-rapporten ikke finnes, er importattribusjonen i
denne baselinen gjort ved å hente de deployede chunkene fra
produksjon og søke etter bibliotekmarkører. Det gir hvilke chunks
som inneholder TanStack Query og Hydrogen React, men ikke
modulnivå-treemap.

**Anbefalt oppfølging:** koble `withBundleAnalyzer` inn i
`next.config.mts` som et lite eget tiltak, slik at KRI-11 kan
sammenligne treemap før/etter.

## Ikke målt / blokkert

| Målepunkt fra issuet                                                    | Status                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Storefront API-kall per hard reload / klientnavigasjon                  | **Blokkert.** Krever serverlogger eller instrumentert Preview; browserharnessen kan rendere med Storefront-credentials, men ser ikke serverens faktiske Shopify-kallantall. Statisk verifisert i stedet: 1× `getProduct` (dedupet), 1× `getProducts(first: 24)` for relaterte, 1× `getProductOptions` (`no-store`) per request. |
| Cache HIT/MISS/STALE per datafunksjon                                   | **Delvis.** Dokumentnivå er observerbart (`x-vercel-cache`). Per-funksjon-status krever `NEXT_PRIVATE_DEBUG_CACHE` i et miljø vi kontrollerer.                                                                                                                                                                                  |
| Varighet for `getCachedProductPageData`, `fetchProductOptions`, JSON-LD | **Blokkert.** Ingen `Server-Timing`-header i produksjon. Cachenøkkelen ignorerer query-strenger, så kald sti kan ikke tvinges utenfra — cache-bustede requests returnerte `HIT` med `age: 607`. Krever Preview-deploy med instrumentering.                                                                                      |
| INP-interaksjonsmåling                                                  | **Delvis.** Observer er på plass, men headless uten reelle brukerinteraksjoner gir ikke representativ INP. Variantklikk er verifisert funksjonelt (URL oppdateres, 13,8 KiB RSC per bytte), ikke som INP-tall.                                                                                                                  |
| `pnpm analyze` treemap                                                  | **Blokkert**, se over.                                                                                                                                                                                                                                                                                                          |

Disse hullene må lukkes i en Preview-deploy før KRI-11, ellers
kan server-/cachesiden av budsjettet ikke bevises.

## Budsjett og obligatoriske mål

### Harde krav (guardrails)

| Krav                                                              | Baseline                      | Etter-krav                                         |
| ----------------------------------------------------------------- | ----------------------------- | -------------------------------------------------- |
| Server Action-requests etter passiv mount                         | 0 observert, mekanisme finnes | 0 — og `getProductAction` skal ikke være `queryFn` |
| Dehydrerte TanStack-produktqueries på PDP                         | 1 (17,5 KiB)                  | 0                                                  |
| Server Actions brukt som TanStack `queryFn` på PDP                | 1 (`getProductAction`)        | 0                                                  |
| Fullstendige produktobjekter til klient kun for statisk rendering | ja (props + dehydrert state)  | 0                                                  |
| CLS                                                               | 0,0028                        | ≤ 0,0028                                           |
| Hydration-/Suspense-advarsler                                     | 0                             | 0                                                  |
| Funksjonell regresjon i variantvalg eller cart                    | ingen                         | ingen                                              |

### Styringsmål

Målt fra klientnavigasjon (rutespesifikk JS) og hard reload
(payload/lab).

| Mål                                                  | Baseline                                | Terskel               |
| ---------------------------------------------------- | --------------------------------------- | --------------------- |
| Rutespesifikk klient-JS, overført                    | 258,0 KiB                               | ≤ 206,4 KiB (−20 %)   |
| Rutespesifikk klient-JS, ukomprimert                 | 845,2 KiB                               | ≤ 676,2 KiB (−20 %)   |
| Serialisert produkt-/hydration-data                  | 17,5 KiB dehydrert + full produkt-props | ≤ 8,8 KiB (−50 %)     |
| Scripting/hydration-tid (long-task-tid, hard reload) | 1 629 ms                                | ≤ 1 303 ms (−20 %)    |
| LCP (techdown-plain)                                 | 1 684 ms                                | ≤ 1 768 ms (+5 % tak) |
| TBT (techdown-plain)                                 | 865 ms                                  | ≤ 908 ms (+5 % tak)   |

Avvik må forklares med måledata, ikke skjules med
ikke-sammenlignbare kjøringer. Merk at LCP/TBT måles mot
produksjon med delt tredjepartslast (765 KiB tredjeparts JS,
GTM/Klarna/Sentry); ved store avvik skal tredjepartsandelen
kontrolleres før konklusjon.

## Anbefalt rekkefølge

Rekkefølgen i prosjektdokumentet holder, med to justeringer fra
måledata:

1. **KRI-12 er implementert via PR #81.** Den eldre PR #74 skal
   ikke merges; korrigert `baseline-v2` må måles på dagens `main`
   før refaktoreringen.
2. **KRI-7** — fjern `HydrationBoundary`, `QueryClient` og
   `getProductAction` som `queryFn`. Gir −17,5 KiB RSC direkte og
   fjerner den latente refetch-mekanismen. Lavest risiko, høyest
   bevisverdi.
3. **KRI-10 (delvis, kan starte parallelt)** — konsolidér de fire
   `getProduct`-lastingene til én eier. Fiks `cacheTag` på
   `getCachedProductForMetadata` og `cacheLife`-divergensen for
   JSON-LD; begge er korrekthetsfeil, ikke bare ytelse. Cache
   også `fetchProductOptions`.
4. **KRI-8** — kompakt variantmodell. Dette er der resten av
   payload-reduksjonen ligger (14 variant-GID-er og 14
   `bridgeFor`-referanser per side).
5. **KRI-9** — del i Server Components og klientøyer. Størst
   effekt på rutespesifikk JS, men også størst regresjonsflate;
   tas etter at datakontrakten er stabil.
6. **KRI-11** — etter-måling med samme korrigerte
   harness-versjon, samme flagg og samme miljø som `baseline-v2`.

**Før KRI-11:** koble inn `withBundleAnalyzer`, og skaff en
Preview-deploy med `Server-Timing` eller cache-debug slik at
server-/cachemålepunktene kan lukkes.

## Reproduksjon

```bash
pnpm exec next typegen          # kreves før typecheck
pnpm typecheck
pnpm lint
node scripts/perf/measure-pdp-baseline.mjs --runs=3 --label=baseline-v2
```

Rådata: `output/perf/pdp-baseline.json` (git-ignorert; arkiveres
på issuet).
