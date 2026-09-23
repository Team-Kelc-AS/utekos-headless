# Design System: Utekos Sticky CTA

## 1. Visuelt uttrykk

En rolig kjøpslinje for norske Utekos-kunder, bygget videre på
dagens merkevare. DESIGN_VARIANCE 4, MOTION_INTENSITY 3,
VISUAL_DENSITY 4. Fullt variantnavn, pris og Klarna er
hierarkiet. Produktfeltet åpner produktvelgeren, som beholder
produktbildene.

## 2. Farger

Kjøpslinjen bruker `--primary` og `--primary-foreground`, med
`#b44701` og hvit som reserve i isolerte layouter. Produktpanelet
beholder `--background` og `--foreground`. Klarna eier sine
knappefarger. Valgt variant vises med hake og kant.

## 3. Typografi

Google Sans Flex via `--font-sans`. Variantnavn 12–16 px etter
skjermbredde, valgknapp 14 px, paneltittel 20 px og pris 14 px
med tabulære tall. Ingen nye fonter.

## 4. Komponenter

Panel og kjøpslinje har 20 px hjørner. Produktvalg har 12 px
hjørner, bilder 8 px, og lukkeknappen er rund. Klarna beholder
den eksisterende pilleformen. Trykkflater er minst 44 px. Hover
og tastaturfokus er synlige. Katalog- og Klarna-lasting har
statusmeldinger; Klarna-feil vises inline.

## 5. Layout

Vises bare under 768 px. Variantnavn med ™ står til venstre med
pris under i dempet tekst. Klarna står til høyre og bruker
plassen som er tilgjengelig, opptil SDK-ens størrelse (335 × 50
px). Variantfeltet åpner produktvelgeren. Hele portalen
avmonteres ved nettbrettbredde, inkludert åpent produktpanel og
reservert plass. Panelet er maksimalt 440 px bredt og 520 px
høyt, begrenset av tilgjengelig skjermplass. Respekter safe-area
nederst. Lag 40 for linjen, 50 for panel, i tråd med eksisterende
dialoglag. Footerplassen følger faktisk høyde.

## 6. Bevegelse og interaksjon

Kun liten trykkrespons. Ingen kontinuerlig animasjon. Reduced
motion fjerner skalering. Base UI eier fokusavgrensing, Escape og
retur til utløseren.

## 7. Begrensninger

Bruk ekte produktbilder og offentlige produktnavn. Ikke legg inn
kunstige lagerindikatorer, genererte produktbilder, dekorative
merker eller ekstra betalings-CTA-er. Bevar sidens etablerte
tema; ingen selvstendig temaveksler.
