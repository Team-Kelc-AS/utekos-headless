# Visuell godkjenningsport — 2026-09-07

## Utkast

- Referanse: https://p.superdesign.dev/draft/c6c379a0-4437-4574-8d30-80b31a57bb67
- Raffinert desktop, versjon 4: https://p.superdesign.dev/draft/fb717324-c592-4fd8-bbbb-f23cb2712c19
- Samme retning på mobil, versjon 1: https://p.superdesign.dev/draft/3e73d243-c1be-45d2-b1fa-cc84adc2c6dd

## Kontrollert i canvas-forhåndsvisningen

- Dokumentbredde lik viewport ved 390, 768 og 1440 px; ingen horisontal sideoverflyt.
- Én redaksjonell artikkel og tre tabeller med henholdsvis 9, 9 og 14 datarader.
- Alle 27 TechDown-måleverdier er identiske med den låste kontrakten.
- Alle åtte spørsmål og svar er ordrett identiske med den godkjente FAQ-teksten i HTML-utkastet.
- Google Sans Flex brukes til overskrifter og Utekos Text til brødtekst. De eksakte opplastede Utekos-logoene vises gjennom den gjenbrukbare headeren.
- Native summary åpner siste FAQ med Enter. Fokus blir på SUMMARY og har synlig omriss. Minste summary var 68 px høy.
- De fire telefon-/epostlenkene i artikkelen har 44 px høy betjeningsflate.
- TechDown-tabellen er en navngitt region med tabIndex=0. Ved 390 px er regionen 356 px og tabellen 600 px. Høyrepil flyttet scrollLeft fra 0 til positiv verdi; fokusomriss var synlig.
- Ingen konsollfeil registrert i den rene fanen for den ferdige mobil-/desktopforhåndsvisningen.
- Redusert-bevegelse-CSS er til stede. Ingen nye medier ble produsert.
- git diff --check bestod.

## Ikke implementert eller verifisert ennå

Dette er en designforhåndsvisning, ikke produksjonskode. MDX-rute, delt TechDown-TypeScript, returpolicy, Shopify-policygenerator, assistent/NBCC-tekster, FAQPage/metadata og regresjonstester gjenstår etter visuell godkjenning. Ingen typecheck/produksjonsbygg/deploy er kjørt for en appendring. Full WCAG-, nettverks-, hydrerings- og produksjonskontroll hører til implementeringsporten.

Den eksisterende arbeidskopiens fire ulagrede størrelsesguideendringer er bevart. Ingen appkilde eller forretningspolicy er redigert i denne fasen. Kun .superdesign-kontekst og ignore-regel er lagt til.

