# Sticky CTA

Importer komponenten én gang på siden som skal ha en fast
kjøpslinje:

```tsx
import { StickyCTA } from '@/components/commerce/StickyCTA'

export default function Page() {
  return (
    <>
      <main>{/* Sideinnhold */}</main>
      <StickyCTA />
    </>
  )
}
```

`StickyCTA` er en Server Component med egen Suspense-grense. Den
henter alle produkter i den offentlige
produktpresentasjonskatalogen via `getProductModel`. Produkter
som ikke finnes i Storefront, utelates. Feil ved lasting gir en
lenke til produktoversikten. Ingen produkter gir ingen
kjøpslinje.

For en side med `'use client'`: importer `StickyCTA` i sidens
serverforelder, og send den som en slot/children til
klientkomponenten. `StickyCTAClient` kan også brukes direkte med
ferdig hentede `ProductModel[]`.

## Atferd

- Produktvariant med ™ står til venstre, med pris under i en
  dempet farge. Klarna står til høyre og bruker tilgjengelig
  bredde, opptil SDK-ens størrelse (335 × 50 px). Produktfeltet
  åpner produktvelgeren ved trykk. Bakgrunnen bruker primary.
  Lange navn kan rulles vannrett på de smaleste skjermene uten å
  flytte Klarna-knappen.
- Komponenten monteres bare under 768 px. Ved større bredder
  fjernes også produktlisten og plassen reservert nederst.

- TechDown M, offentlig navn Middels, er forhåndsvalgt. Dette
  endrer ikke standardvarianten på andre produktsider.
- Alle offentlige produkter og varianter vises, med bilder, pris
  og lagerstatus. Utsolgte varianter kan inspiseres, men
  kjøpsknappen er deaktivert.
- Manglende TechDown M gir «Velg produkt», aldri et umerket
  erstatningsprodukt.
- Valg åpnes over kjøpslinjen. Escape, lukkeknapp og valg
  returnerer fokus til utløseren. Panelet har egen rulling og
  fokusavgrensing.
- Klarna bruker eksisterende `KlarnaProductExpressCheckout`,
  inkludert handlekurv, add_to_cart og begin_checkout.
  Eksisterende varer i handlekurven inngår i betalingsflyten, som
  på dagens produktsider.
- Siden bruker sin eksisterende handlekurvprovider. På
  selvstendige landingssider sørger `EnsureCartProviders` for den
  samme tilkoblingen.
- Komponenten plasseres i en portal under body, med målt plass
  etter footeren, slik at den ikke klippes av seksjoner med
  transform/overflow eller dekker sidens siste innhold. Den
  fjernes når siden avmonteres.
- Egen CSS-modul gjør at komponentens layout også virker på sider
  uten global CSS eller Tailwind, samt med Tailwind
  `source(none)`. Den arver sidens semantiske fargetokens og font
  når de finnes, med egne Utekos-farger og systemfont som
  reserve. Klarna får eksplisitt knapphøyde i komponentens CSS.
- Kjøpslinjen er synlig fra innlasting på mobil. Importer den
  ikke samtidig med en annen fast kjøpslinje på samme side.

## Dokumentasjon kontrollert 2026-09-22

- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components),
  også kontrollert mot installerte Next.js 16.3.1-dokumenter.
- [Klarna: One-step Express checkout](https://docs.klarna.com/acquirer/klarna/express-checkout/integrate-express-checkout/integrate-one-step-express-checkout/).
- [Base UI: Popover](https://base-ui.com/react/components/popover).
- [React: createPortal](https://react.dev/reference/react-dom/createPortal).
- [React: useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).
- [MDN: var() og reserveverdier](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/var).
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver).

Ingen produksjonsside er endret for å aktivere komponenten
automatisk.

## Verifisering

- Typesjekk og ESLint for endrede komponenter bestått.
- Ni tester for forhåndsvalg, størrelsesetiketter,
  Klarna-forberedelse og handlekurv-bootstrap bestått.
  Forhåndsvalgstesten ble først kjørt uten implementasjonen og
  feilet som forventet.
- Nettleserkontroll ved 320, 390 og 1280 px: produktbytte,
  prisoppdatering, utsolgt-knapp, Klarna-rendering, Escape,
  fokusretur og ingen horisontal overflow. Både nettbutikkens og
  landingssidens oppsett ble kontrollert.
- Isolert MDX-layout på `/produkter/techdown` kontrollert ved 320
  og 1280 px uten global CSS: synlig bakgrunn, Klarna-knapp,
  produktvelger, oppdatert pris og Escape/fokusretur. Ingen
  horisontal overflow eller konsollfeil. Typesjekk og målrettet
  ESLint bestått etter rettelsen.
- Portal og footer-klaring kontrollert i DOM: footerens underkant
  781,5 px, kjøpslinjens overkant 793,6 px ved bunnen av
  desktop-visningen.
- Ingen reell betaling gjennomført. Produksjonsbygg og Lighthouse
  er ikke kjørt; visuell testing brukte den lokale
  utviklingsserveren.
- Forenkling og lokal kildekodegjennomgang utført uten
  delegering. Code review: skipped (ce-code-review unavailable).
  Den separate review-arbeidsflyten krever delegering, som ikke
  var tillatt i denne økten.
