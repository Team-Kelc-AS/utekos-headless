# Størrelsesguide — designkontekst

Denne mappen er den varige Superdesign-konteksten for `/handlehjelp/storrelsesguide`. Nettsidekoden skal ikke endres før brukeren har godkjent mobil- og desktopretningen, i henhold til den bestilte planen.

- `init/`: fullført kodebaseanalyse.
- `context-manifest.md`: samtlige 41 valgte originale kildefiler.
- `context/`: komplette kildeutdrag pakket i grupper. Tjenesten tillater maks 20 kontekstfiler og 50 000 tegn per fil. Ingen valgte UI-kilder er utelatt for å komme under grensene.
- `design-system.md`: eksisterende farger, typografi, geometri og tilgjengelighetskrav.
- `size-guide-brief.md`: låst innholds-/datakontrakt for den raffinerte retningen.
- `resume.json`: prosjekt, referanse, aktiv retning, merkevarefiler og kildefingeravtrykk.
- `tmp/`: ignorerte HTML-utkast, renderer og nedlastet referanse. Ikke release-innhold.

## Gjenoppta trygt

Kontroller både `fingerprints` for faktiske kontekstfiler og `sourceFingerprints` for originalfilene bak pakkene. Hvis en originalfil er endret, regenereres dens komplette kildepakke før ny generering. De ekstra originalfingeravtrykkene hindrer at pakkede filer skjuler endringer i arbeidskopien. Behold ulagrede brukerendringer.

## Referanse og avgrensning

Referanseversjonens redaksjonelle artikkel er rendret direkte fra de eksisterende React-komponentene uten datakorrekteringer. Topp-/bunnfelt følger kildekoden. Butikkseksjonen bruker eksisterende bilder og priser, men lenker til produktene; den er en visuell forhåndsvisning, ikke en aktiv handlekurv/kasse. Ingen betaling, påmelding eller kundedata sendes fra utkastet.

Den separate kildebaserte referansen er `c6c379a0-4437-4574-8d30-80b31a57bb67`. Aktiv refinering skjer i `fb717324-c592-4fd8-bbbb-f23cb2712c19`. Produksjon er ikke endret.

## Verifisert dokumentasjon

MDX-kontrakten er sjekket i lokal Next.js-dokumentasjon og Context7 for `/vercel/next.js`. Statisk prototypeeksport følger React `renderToStaticMarkup` (https://react.dev/reference/react-dom/server/renderToStaticMarkup). Canvas-prototypen bruker Tailwind Play CDN v4 (https://tailwindcss.com/docs/installation/play-cdn), bare for designforhåndsvisning, aldri som endring i produksjonsbygget. Context7-returnerte Tailwind-eksempler var eldre enn Play CDN v4; den konkrete CDN-syntaksen er derfor kontrollert direkte mot offisiell dokumentasjon.
