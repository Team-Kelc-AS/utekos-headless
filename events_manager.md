# Meta Events Manager — status og eventregister

**Datasett:** `Utekos Pixel` (`1092362672918571`)
**Business:** Utekos Marketing Data Layer (`1384717111999921`)
**Målevindu:** 7 døgn, 2026-07-24 → 2026-07-31
**Førsteparts-cookie:** aktivert · **Conversions API Gateway:** ikke onboardet
**Kilder:** Meta Ads MCP (`ads_get_dataset_stats`, `ads_get_dataset_quality`,
`ads_get_dataset_details`), Meta Developer Tools MCP (`devtools_discovery`),
og kodebasen i dette repoet.

---

## 1. Åpne meldinger fra Events Manager

### 1.1 Purchase mangler `value` på 21 % av hendelsene

| Felt         | Verdi                                           |
| --------------| -------------------------------------------------|
| Event        | `Purchase`                                      |
| Andel berørt | 21 %                                            |
| Integrasjon  | Conversions API                                 |
| Feilmelding  | `Ex. "" isn't allowed – Value field is missing` |

**Krav til `value`:** numerisk, større enn 0, desimaltall tillatt (`9.99`
eller `9`). Sendes sammen med `currency` i `custom_data`.

**Status i koden:** `mapCanonicalPurchaseToMeta.ts` setter alltid både
`currency` og `value` fra `event.custom_data`, og kaster feil hvis
markedsføringssamtykke mangler. Den aktive kodestien kan derfor ikke
produsere `Purchase` uten `value`.

**Åpent punkt:** de 21 % må komme fra enten (a) historiske hendelser
utenfor 7-døgnsvinduet, eller (b) en annen `Purchase`-avsender mot samme
datasett. Verifiser i Events Manager → `Purchase` → *Integrasjoner* før
kodeendring vurderes.

### 1.2 Deduplisering er ikke satt opp for `Purchase`

Dette er korrekt observert, og årsaken er strukturell:

- `Purchase` sendes **kun server-side** (7 av 7 hendelser i vinduet).
- Kilden er Shopify-webhooken `orders/paid` →
  `shopifyOrderToCanonicalPurchase.ts` → Meta CAPI.
- Shopify-checkout kjører en **custom pixel som bare laster Google**
  (`GT-MKRLF5WK` via `https://utekos.no/__sgtm`). Den inneholder ingen
  `fbq`-kall.

Uten en nettleser-`Purchase` finnes det ingen duplikat å deduplisere mot.
`event_id` er deterministisk avledet fra Shopify-ordrens legacy-ID med
SHA-256 (`purchaseEvent.ts`), så dedupliseringsnøkkelen finnes — den har
bare ingen motpart.

> **Vurdering:** server-only `Purchase` med EMQ 9.3 er allerede sterkt.
> Å legge til en Meta-pixel-`Purchase` i Shopify-checkout gir marginal
> gevinst og krever at samme `event_id` eksponeres til checkout.
> Anbefaling: behold server-only og lukk varselet bevisst.

### 1.3 Opplastingsfrekvens `hourly`

Meldingen gjelder ikke bare `ViewContent`. Tre eventer rapporterer
`hourly` i stedet for `real_time`:

| Opplastingsfrekvens | Eventer |
| --- | --- |
| `hourly` | `ViewContent`, `PageView`, `LandingScrollDepth` |
| `real_time` | `AddToCart`, `InitiateCheckout`, `SelectItem`, `ViewCategory`, `ViewItemList` |
| Ikke rapportert | `Purchase`, `Lead`, `ViewCart`, `RemoveFromCart`, `HeroInteract`, `InteractWithAccordion` |

Alle tre `hourly`-eventene er også de tre høyeste i volum. Mønsteret
peker mot at høyvolumseventer batches i utboks-køen
(`dispatch_mode: 'server_retry'`), mens lavvolumseventene tømmes
umiddelbart.

---

## 2. Komplett eventregister

Alle 16 eventer som traff datasettet i vinduet. Kolonnen *Nettleser*
er andelen hendelser fra pixel; resten kommer fra Conversions API.
Kildefordelingen er målt fra 2026-07-26 17:00, som er første fulle
døgn med nettleserhendelser.

| Event                   | Antall     | Andel     | Nettleser | EMQ         | Click ID (`fbc`) | Frekvens    |
| -------------------------| -----------:| ----------:| ----------:| ------------:| -----------------:| -------------|
| `LandingScrollDepth`    | 3 609     | 34,6 %    | 32,0 %    | 6,1         | 59,3 %           | `hourly`    |
| `PageView`              | 3 039     | 29,1 %    | 30,5 %    | 6,1         | 56,9 %           | `hourly`    |
| `ViewContent`           | 2 269     | 21,8 %    | 26,1 %    | 6,1         | 67,7 %           | `hourly`    |
| `ViewItemList`          | 626        | 6,0 %     | 30,9 %    | 6,1         | 35,3 %           | `real_time` |
| `AddToCart`             | 158        | 1,5 %     | 31,5 %    | 6,1         | 52,6 %           | `real_time` |
| `ViewCategory`          | 148        | 1,4 %     | 34,1 %    | 6,1         | 46,2 %           | `real_time` |
| `ViewCart`              | 131        | 1,3 %     | 32,0 %    | 6,1         | 71,4 %           | –           |
| `InteractWithAccordion` | 114        | 1,1 %     | 38,6 %    | 6,1         | 28,0 %           | –           |
| `InitiateCheckout`      | 106        | 1,0 %     | 31,6 %    | 6,1         | 46,7 %           | `real_time` |
| `SelectItem`            | 79         | 0,8 %     | 19,7 %    | 6,1         | 42,1 %           | `real_time` |
| `HeroInteract`          | 61         | 0,6 %     | 23,2 %    | 6,1         | 30,0 %           | –           |
| `Lead`                  | 34         | 0,3 %     | 31,8 %    | **6,2**     | ikke sendt       | –           |
| `RemoveFromCart`        | 32         | 0,3 %     | 32,0 %    | 6,1         | 100 %            | –           |
| `OpenQuickView`         | 13         | 0,1 %     | 33,3 %    | ikke scoret | ikke scoret      | –           |
| `Purchase`              | 7          | 0,1 %     | **0 %**   | **9,3**     | 100 %            | –           |
| `AddToWishlist`         | 2          | 0,0 %     | 0 %       | ikke scoret | ikke scoret      | –           |
| **Totalt**              | **10 428** | **100 %** | ~30 %     |             |                  |             |

`OpenQuickView` og `AddToWishlist` har for lavt volum til å få
EMQ-score fra Meta.

### 2.1 Eventer nevnt i den opprinnelige rapporten

`Purchase`, `PageView`, `ViewContent`, `AddToCart`, `ViewCart`,
`ViewCategory`, `InitiateCheckout`.

### 2.2 Eventer som ikke var dokumentert

Ni eventer manglet i den opprinnelige rapporten. Alle er egendefinerte
(ikke Meta-standard) bortsett fra `Lead`, `RemoveFromCart` og
`AddToWishlist`.

| Event                   | Canonical-kilde                    | Utløser                       | Merknad                                                                             |
| -------------------------| ------------------------------------| -------------------------------| -------------------------------------------------------------------------------------|
| `LandingScrollDepth`    | `scrollDepthReporter.ts`           | Scroll-terskler 25/50/75/90 % | Største event i datasettet. Maks 4 per sidevisning, nullstilles ved SPA-navigasjon. |
| `ViewItemList`          | `viewItemListReporter.ts`          | Produktliste i viewport       | Maks 20 varer per hendelse. Lavest `fbc`-dekning av commerce-eventene.              |
| `SelectItem`            | `selectItemReporter.ts`            | Klikk på produktkort i liste  | Lavest nettleserandel (19,7 %).                                                     |
| `InteractWithAccordion` | `interactWithAccordionReporter.ts` | Åpning av trekkspill          | Kun `interaction_type: "open"`; lukking spores ikke.                                |
| `HeroInteract`          | `heroInteractReporter.ts`          | Klikk på hero-CTA             | Bærer `cta_id` og `destination_path`.                                               |
| `OpenQuickView`         | `openQuickViewReporter.ts`         | Åpning av hurtigvisning       | For lavt volum til EMQ-score.                                                       |
| `RemoveFromCart`        | `removeFromCartReporter.ts`        | Fjerning fra handlekurv       | 100 % `fbc`-dekning.                                                                |
| `Lead`                  | `pushGenerateLeadToDataLayer.ts`   | Skjemainnsending              | Eneste ikke-`Purchase`-event med e-post.                                            |
| `AddToWishlist`         | `addToWishlistReporter.ts`         | Legg i ønskeliste             | 2 hendelser på 7 døgn. Vurder om funksjonen er synlig nok.                          |

### 2.3 Implementert, men uten trafikk

`Search` har både CAPI-mapper (`mapCanonicalSearchToMeta.ts`),
dispatcher og server-mottaker, men **null hendelser** i vinduet.
Årsaken er at det ikke finnes noen browser-reporter som kaller
`searchEvent.ts` fra UI-et — hendelsen produseres aldri.

Meta anbefaler eksplisitt å flagge eventer med nullvolum som brukes i
aktive kampanjer. `Search` bør enten kobles til søkefeltet eller
markeres som inaktiv i eventkatalogen.

---

## 3. Match-nøkler og Event Match Quality

Alle eventer sender `ip_address`, `user_agent`, `fbp` og `external_id`
med 100 % dekning. Forskjellene ligger i kundeinformasjon:

| Event             | Match-nøkler utover baseline                    | EMQ |
| -------------------| -------------------------------------------------| ----:|
| `Purchase`        | `email`, `phone`, `zip`, `country`, `ct`, `fbc` | 9,3 |
| `Lead`            | `email`                                         | 6,2 |
| `RemoveFromCart`  | `fbc`                                           | 6,1 |
| Øvrige 11 scorede | `fbc` (delvis dekning)                          | 6,1 |

**Tolkning:** taket på 6,1 skyldes at anonyme økter kun har
tekniske identifikatorer. Meta oppgir `em`, `ph`, `fn`, `ln` og
`client_ip_address` som de sterkeste match-parameterne.

**Løftepotensial:** når en besøkende allerede er identifisert
(nyhetsbrevpåmelding, innlogget kunde, gjenkjent `external_id` med
lagret e-post), kan hashet `em`/`ph` legges på commerce-eventene før
kjøp. Det er den eneste realistiske veien fra 6,1 mot 8+ på
`ViewContent`, `AddToCart` og `InitiateCheckout`.

---

## 4. Hvorfor Click ID (`fbc`) aldri når 100 %

Dette var det åpne spørsmålet i den opprinnelige rapporten. Det er to
uavhengige årsaker, og bare den andre er en feil.

### 4.1 Strukturell årsak — `fbc` finnes ikke for all trafikk

Per Metas egen dokumentasjon kan `fbc` bare eksistere når økten
stammer fra et Meta-annonseklikk: verdien bygges som
`fb.<subdomainIndex>.<creationTime>.<fbclid>` fra `fbclid` i URL-en,
eventuelt fra en lagret `_fbc`-cookie (90 dager).

Organisk trafikk, direktetrafikk, Google og Microsoft har ingen
`fbclid`. Meta *anbefaler* å sende `fbc` med hver hendelse, men
parameteren er fysisk fraværende for ikke-Meta-trafikk. Dekningen er
derfor et mål på andelen Meta-attribuert trafikk — ikke en feilrate.

### 4.2 Sannsynlig teknisk årsak — kappløp mot attribusjonsberikelsen

Dekningen følger et tydelig mønster som ren trafikkmiks ikke forklarer
alene:

| Posisjon i økten | Event                   | Dekning |
| ------------------| -------------------------| --------:|
| Sent             | `ViewCart`              | 71,4 %  |
| Sent             | `ViewContent`           | 67,7 %  |
| Midt             | `LandingScrollDepth`    | 59,3 %  |
| Midt             | `PageView`              | 56,9 %  |
| Midt             | `AddToCart`             | 52,6 %  |
| Midt             | `InitiateCheckout`      | 46,7 %  |
| Tidlig           | `ViewCategory`          | 46,2 %  |
| Tidlig           | `SelectItem`            | 42,1 %  |
| Tidlig           | `ViewItemList`          | 35,3 %  |
| Tidlig           | `HeroInteract`          | 30,0 %  |
| Tidlig           | `InteractWithAccordion` | 28,0 %  |

Dekningen stiger monotont med hvor sent i økten hendelsen inntreffer.
`enrichCanonicalEventWithMetaAttribution.ts` henter `_fbc` asynkront
via `/api/meta/parameter-context` når cookien ikke allerede finnes.
Hendelser som utløses før det svaret er tilbake, sendes uten `fbc`.

**Hypotesen er falsifiserbar:** mål tiden fra `DOMContentLoaded` til
`_fbc` er skrevet, på en landingsside åpnet med `?fbclid=test`. Hvis
`HeroInteract` og `ViewItemList` normalt kan utløses innenfor det
vinduet, er årsaken bekreftet.

**Tiltak hvis bekreftet:** hold tilbake dispatch til
`ensureCanonicalMetaBrowserIds` har løst `fbc`, eller bygg `fbc`
synkront fra `fbclid` i URL-en ved første sidelast i stedet for å vente
på cookie-oppslaget. `clickIdSessionStore.ts` leser allerede `fbclid`
fra URL og lagrer i `localStorage` i 90 dager — verdien er tilgjengelig
lokalt før nettverkskallet fullfører.

### 4.3 `Lead` sender ikke `fbc` i det hele tatt

`Lead` mangler `fbc` fullstendig i match-nøkkellisten, ikke bare
delvis. Det er et separat avvik fra de andre eventene og bør
undersøkes i `mapCanonicalLeadToMeta.ts`.

---

## 5. Deduplisering

Ratioen mellom nettleser- og serverhendelser er stabil på omtrent
1 : 2 på tvers av alle eventer (nettleserandel 19,7–38,6 %). Det er
det forventede mønsteret når Conversions API dekker 100 % av trafikken
mens pixel blokkeres av annonseblokkere, ITP og utvidelser.
Dedupliseringen fungerer: `event_id` er samme UUID på begge sider,
generert med `crypto.randomUUID()` og gjenbrukt uendret i CAPI-kallet.

### 5.1 Måletall fra Events Manager

Tabellene under er hentet fra Events Manager-grensesnittet og viser
gjennomsnittlig antall hendelser med dedupliseringsnøkler siste 7 døgn.

**Datasett samlet**

| Dedupliseringsnøkkel | Nettleser | Server | Dekningsgrad |
| --- | ---: | ---: | ---: |
| **Event ID** *(anbefalt)* | 18 (100 %) | 46 (100 %) | **99,43 %** |
| Andre nøkler samlet | – | – | 0,36 % |
| **Total dekningsgrad** | | | **99,79 %** |

**`AddToCart`**

| Dedupliseringsnøkkel      | Nettleser | Server    | Dekningsgrad |
| ---------------------------| ----------:| ----------:| -------------:|
| **Event ID** *(anbefalt)* | 1 (100 %) | 2 (100 %) | **98 %**     |
| Andre nøkler              | –         | –         | 0 %          |
| **Total dekningsgrad**    |           |           | **98 %**     |

**`ViewCart` / `ViewCategory` / `InitiateCheckout`**

| Dedupliseringsnøkkel      | Nettleser | Server    | Dekningsgrad |
| ---------------------------| ----------:| ----------:| -------------:|
| **Event ID** *(anbefalt)* | 1 (100 %) | 2 (100 %) | **96,43 %**  |
| External ID               | 1 (100 %) | 2 (100 %) | 3,57 %       |
| FBP                       | 1 (100 %) | 2 (100 %) | 0 %          |
| **Andre nøkler samlet**   |           |           | **3,57 %**   |

**`PageView`**

| Dedupliseringsnøkkel      | Nettleser | Server    | Dekningsgrad |
| ---------------------------| ----------:| ----------:| -------------:|
| **Event ID** *(anbefalt)* | 1 (100 %) | 2 (100 %) | **57,14 %**  |
| External ID               | 1 (100 %) | 2 (100 %) | 0 %          |
| FBP                       | 1 (100 %) | 2 (100 %) | 0 %          |
| **Andre nøkler samlet**   | –         | –         | **0 %**      |
| **Total dekningsgrad**    |           |           | **57,14 %**  |

### 5.2 To avvik som må avklares

1. **`PageView` dekningsgrad 57,14 %.** Alle andre eventer ligger på
   96–99 %. Koden setter `event_id` på hver `PageView` i både
   `PageViewObserver.tsx` og CAPI-mapperen, så tallet lar seg ikke
   forklare fra kodestien alene.
2. **«`PageView`: 56,88 % of total events» fra rapporten.** Målt via
   API-et utgjør `PageView` 29,1 % av volumet, ikke 56,88 %.

Begge tallene ligger nær 57 %, noe som tyder på at de måler det samme
underliggende forholdet. Avklar definisjonen i Events Manager før det
behandles som en feil.

---

## 6. Prioriterte tiltak

| #   | Tiltak                                                           | Begrunnelse                                     | Krever                 |
| -----| ------------------------------------------------------------------| -------------------------------------------------| ------------------------|
| 1   | Verifiser hvilken integrasjon som sender `Purchase` uten `value` | Direkte ROAS-feil på 21 % av kjøpene            | Events Manager-oppslag |
| 2   | Bekreft eller avkreft `fbc`-kappløpet med `?fbclid=test`         | Løfter Click-ID-dekning på alle tidlige eventer | Nettleserverifikasjon  |
| 3   | Undersøk hvorfor `Lead` ikke sender `fbc`                        | Isolert avvik, liten innsats                    | Kodegjennomgang        |
| 4   | Avklar `PageView` 57,14 % dekningsgrad                           | Største uforklarte tall i rapporten             | Events Manager-oppslag |
| 5   | Koble `Search` til UI eller marker som inaktiv                   | Mapper uten trafikk                             | Kodeendring            |
| 6   | Legg hashet `em`/`ph` på identifiserte økter                     | Eneste vei fra EMQ 6,1 mot 8+                   | Samtykkevurdering      |
| 7   | Lukk dedupliseringsvarselet for `Purchase` bevisst               | Server-only er korrekt arkitektur her           | Beslutning             |

---

## 7. Verifikasjon

**Utført**

- Eventvolum, kildefordeling og opplastingsfrekvens hentet fra
  Meta Ads MCP mot datasett `1092362672918571`.
- `fbc`-formatkrav og EMQ-anbefalinger verifisert mot gjeldende
  Meta-dokumentasjon via Meta Developer Tools MCP.
- Emittere, `event_id`-generering, samtykkeporter og CAPI-mappere
  lest direkte i `src/lib/analytics/`.
- Bekreftet at Shopify-checkoutens custom pixel kun laster Google.

**Ikke utført**

- Ingen nettleserkjøring mot produksjon; `fbc`-kappløpet i 4.2 er en
  hypotese basert på kode og dekningsmønster, ikke en måling.
- Ingen oppslag i Events Manager-grensesnittet; punkt 1 og 4 i
  tiltakslisten er derfor fortsatt åpne.
- Ingen endringer utført på datasett, pixel, GTM eller kode.
