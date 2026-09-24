const SITE_URL = 'https://utekos.no'

export function buildHomeMarkdown(): string {
  return `# Utekos – Skreddersy varmen

Utekos er en norsk merkevare for kompromissløs utendørs komfort. Vi designer justerbare
komfortplagg som holder deg varm på terrassen, hytta, i båten, i bobilen og i kaldt vær –
med tydelig vekt på varme, fleksibel bruk, materialkvalitet og enkel vedlikehold.

## Kom i gang

- [Skreddersy varmen](${SITE_URL}/skreddersy-varmen): Slik fungerer 3-i-1-logikken – juster, form og nyt.
- [Alle produkter](${SITE_URL}/produkter): Oversikt over hele sortimentet.
- [Sammenlign modeller](${SITE_URL}/handlehjelp/sammenlign-modeller): Forskjeller mellom TechDown, Mikrofiber og Dun.
- [Størrelsesguide](${SITE_URL}/handlehjelp/storrelsesguide): Finn riktig størrelse.
- [Teknologi og materialer](${SITE_URL}/handlehjelp/teknologi-materialer): Materialer, isolasjon og konstruksjon.

## Trygghet og service

- [Frakt, retur og refusjon](${SITE_URL}/frakt-og-retur)
- [Kontakt oss](${SITE_URL}/kontaktskjema)
- [Om Utekos](${SITE_URL}/om-oss)

## Maskinlesbare flater

- [AI-indeks (llms.txt)](${SITE_URL}/llms.txt)
- [Utvidet AI-kontekst](${SITE_URL}/llms-full.txt)
- [Nettstedskart](${SITE_URL}/sitemap.xml)
`
}
