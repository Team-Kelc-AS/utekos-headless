---
name: Utekos Brand
colors:
  primary: "##b44701"
  secondary: "##00453e"
  surface: "##012622"
  on-surface: "##f0eee9"
  error: "##ffb4ab"
typography:
  body-md:
    fontFamily: Google Sans Flex
    fontSize: 16px
    fontWeight: 400
rounded:
  md: 12px
---


# Design System

## Overview
A focused, minimal dark interface for a developer productivity tool.
Clean lines, low visual noise, high information density.

## Colors
- **Primary** (#b44701): CTAs, active states, key interactive elements
- **Secondary** (#00453e): Supporting UI, chips, secondary actions
- **Surface** (#002521): Page backgrounds
- **On-surface** (#f0eee9): Primary text on dark backgrounds
- **Error** (#ffb4ab): Validation errors, destructive actions

## Typography
- **Headlines**: Google Sans Flex: --font-sans, extrabold
- **Body**: Google Sans Flex: --font-sans, regular, 16px
- **Labels**: Google Sans Flex: --font-sans, medium, 14px, uppercase for section headers

## Components
- **Buttons**: Rounded (12px), primary uses brand primary fill
- **Inputs**: 1px border, subtle surface-variant background
- **Cards**: No elevation, relies on border and background contrast

## Do's and Don'ts
- Do use the primary color sparingly, only for the most important action
- Don't mix rounded and sharp corners in the same view
- Do maintain 4:1 contrast ratio for all text

## Kunnskap / Knowledge articles (`/kunnskap/`)

### Tone – «nøktern guide, ikke selger»

Hjemlet i evidensbasert markedsføring: hver artikkel skal kunne bestå
følgende sjekk:

- Påstand → belegg i samme avsnitt. Sterke utsagn uten referansetall
  er ikke ferdige. Hver artikkel skal ha seksjonen «Hva forskningen
  ikke kan si sikkert».
- Ingen superlativer uten tall («enestående», «ufattelig», «gigantisk»,
  «pesten»). Konkretiser eller stryk.
- Skill fakta fra råd: fakta = brødtekst med kildehenvisning, råd =
  `KnowledgeCallout` («Tommelregel: …»).
- Klarspråk: korte setninger, forklar fagord ved første gangs bruk
  («hydrofile (vannelskende)»), aldri informasjon kun via farge.

### Innledning – fast rekkefølge, data fra registeret

`knowledgeArticles.ts` er eneste sannhet (tittel, ingress, datoer,
lesetid, læringspunkter, innholdsfortegnelse, kilder og referanseliste avslutnignsvis).
MDX-bodyinneholder aldri H1, ingress, meta, læringspunkter, ToC eller
referanseliste. `KnowledgeArticleScaffold` rendrer, i rekkefølge:

1. Brødsmuler, H1, ingress (`description`), forfatterkort
2. «Hva du vil lære» (3–6 punkter fra `learnings`)
3. «I denne artikkelen» (`nav` med ankerlenker fra `toc`)
4. Brødtekst (starter på H2 – aldri H1→H3-hopp)
5. Tilbake-til-toppen-pille (ankre `#top`, ingen klient-JS)
6. «Kilder (N)» – lukket med antall, åpnes uten JS (`details`)

Forfatter er alltid Utekos. Byline-logo er det offisielle svart/hvite
merket (`knowledgeAuthors.utekos.avatarImage`) i sirkulær ramme –
aldri den oransje horisontale logoen. Publiseringstidspunkt vises
alltid; oppdatert-tidspunkt når det avviker; lesetid (`readingMinutes`)
alltid.

### Kilder – Think-With-Google-mønster, med ekte lenker

Kollapset seksjon «Kilder (N)» med chevron, numbered list, reelle
utgående lenker der de finnes (DOI/URL), ren tekst der de ikke gjør
det. In-tekst-henvisninger er `<Cite ids={[...]} />` med 1-baserte
indekser mot registerlista; test feiler ved danglende nummer.
TWG lenker ikke ut – vi gjør det, der det finnes noe å lenke til.

### Bilder – frekvens, format, vibe, promptplikt

- Frekvens: hero etter innledning + ca. én illustrasjon per tredje
  H2-seksjon, maks 5 per artikkel. Aldri dekorative bilder uten
  funksjon.
- Format: 16/9 hero, 4/3 inline, 1/1 kun der kvadratisk motiv krever
  det. Alltid `alt`-tekst som beskriver motivet, ikke filnavnet.
- Vibe: norsk vintervirkelighet, fotorealitisk, dempet merkevarepalett.
  Ingen tekst, logoer eller vannmerker i motivet. Ingen glansbilde-
  stock-estetikk.
- Promptplikt: den som plasserer et bilde, leverer genereringspromptet
  i `ArticleImage`-komponentens påkrevde `prompt`-prop. Propen rendres
  ikke til lesere – den er redaksjonell metadata og fremtidig
  verktøyflate. Ingen prompt, ingen bilde (håndheves av typen).

### AI-oppsummerer (planlagt)

`KnowledgeArticle.summary` er reservert felt for maskinelt sammendrag
vist under ingressen. Ikke implementert ennå; feltet sikrer at
innledningsrekkefølgen ikke må endres når den kommer. Krav ved
implementering: server-side generering ved bygg (aldri klient-JS),
faktasjekk mot registerkilder, tydelig merking som sammendrag.
