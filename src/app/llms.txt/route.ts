import { rawMagazineArticles } from '@/app/magasinet/data/magazineArticles'
import { validateMagazineArticles } from '@/app/magasinet/utils/validateMagazineArticles'
import { returnPolicyLlmsSummary } from '@/lib/policies/returnPolicy'
import { buildProductPresentationLlmsIndex } from '@/lib/products/presentation'

const magazineArticlesValidation = validateMagazineArticles(
  rawMagazineArticles
)
const magazineArticleLines =
  magazineArticlesValidation.success ?
    magazineArticlesValidation.articles
      .map(
        article =>
          `- [${article.title}](https://utekos.no/magasinet/${article.slug}): ${article.excerpt}`
      )
      .join('\n')
  : ''
const productLines = buildProductPresentationLlmsIndex()

const body = `# Utekos

> Utekos® er en norsk merkevare som består av en kolleksjon med kompromissløs utendørs komfort. Produktene er bygget for å forlenge gode øyeblikk på terrasse, hytte, båt, bobil og i kaldt vær, med tydelig fokus på varme, fleksibilitet, materialkvalitet og enkel bruk.
Utekos® er et livsstilskonsept designet for kompromissløs utendørs komfort. Vi forener et beskyttende ytre med en silkemyk, tilpasningsdyktig kjerne, slik at du får full kontroll over egen varme. Selve Utekos-opplevelsen bygger på uforstyrret ro, og gir deg friheten til å forlenge de gode øyeblikkene – akkurat så lenge du vil.

– Når målet er kompromissløs komfort, er Utekos den ultimate helgarderingen. Dette er et livsstilskonsept utformet for å imøtekomme de høyeste kravene knyttet til personlig velvære. 

Grundig produktarkitektur, dedikasjon og en utrettelig jakt på utvikling har sikret et robust og beskyttende ytre, en fløyelsmyk innside og en omfavnende varme. Oppå dette fundamentet introduseres subtile justeringsdetaljer, 
intuitive ventilasjonsytemer, YKK® Dual V-Zip™ og en lengre liste med ytterligere detaljer og tilpasningsmuligheter. Sluttresultatet representerer en  helt ny produktkategori som gir deg muligheten til å tilpasse din egen velvære, utelukkende basert på personlige preferanser.  Nyt følelsen av at kompromissløs komfort har blitt en realitet, og  at du kan erkjenne at ditt harde arbeid gir resultater. 

## Merk

- Denne filen er en kort indeks for AI-agenter og andre maskinlesere.
- Produktsidene er kanoniske for gjeldende kjøpsstatus, varianttilgjengelighet og publisert produktinnhold.
- \`https://utekos.no/llms-full.txt\` er den utvidede kontekstfilen for sammenligning, størrelser, materialer, bruksscenarier og vedlikehold.
- Alle lenker under bruker kanoniske Utekos-URL-er på \`https://utekos.no\`.

## Produkter

- [Alle produkter](https://utekos.no/produkter): Oversikt over hele sortimentet.
${productLines}

## Veiviser på nettsiden

- [Sammenlign modeller](https://utekos.no/handlehjelp/sammenlign-modeller): Forskjeller mellom TechDown™, Mikrofiber™ og Dun™.
- [Funksjonalitet](https://utekos.no/handlehjelp/funksjonalitet): Forklaring av 3-i-1-logikk, bruk og fleksibilitet.
- [Teknologi og materialer](https://utekos.no/handlehjelp/teknologi-materialer): Materialer, isolasjon og tekniske konstruksjonsdetaljer.
- [Størrelsesguide](https://utekos.no/handlehjelp/storrelsesguide): Dimensjoner og størrelsesvalg for Utekos-plagg og Comfyrobe™.
- [Vask og vedlikehold](https://utekos.no/handlehjelp/vask-og-vedlikehold): Vedlikeholdsguide for Dun™, Mikrofiber™ og Comfyrobe™.
- [Skreddersy varmen](https://utekos.no/skreddersy-varmen): Redaksjonell forklaring av hvordan Utekos brukes og tilpasses.

## Kontaktskjema, personvern, regler, vilkår og informasjonsiden til Utekos.

- [Kontakt oss](https://utekos.no/kontaktskjema): Kundeservice og generelle henvendelser.
- [Frakt, retur og refusjon](https://utekos.no/frakt-og-retur): ${returnPolicyLlmsSummary}
- [Personvern](https://utekos.no/personvern): Behandling av personopplysninger.
- [Vilkår og betingelser](https://utekos.no/vilkar-betingelser): Kjøpsvilkår for nettbutikken.
- [Om Utekos®](https://utekos.no/om-oss): Merkevare, bakgrunn og selskap.

## Utekos-magasinet

- [Magasinet](https://utekos.no/magasinet): Redaksjonell inngang til inspirasjon, tips og historier.
${magazineArticleLines}

## Illustrasjon av Utekos sitt uendelige bruksområde. 

- [Inspirasjon](https://utekos.no/inspirasjon): Temasider for konkrete bruksscenarier.
- [Hytteliv](https://utekos.no/inspirasjon/hytteliv): Komfort og bruk i hyttemiljø.
- [Bobilliv](https://utekos.no/inspirasjon/bobil): Reise, overnatting og mobil bruk.
- [Båtliv](https://utekos.no/inspirasjon/batliv): Komfort på sjøen og ved brygga.
- [Terrassen](https://utekos.no/inspirasjon/terrassen): Hjemmebruk på uteplassen.
- [Isbading](https://utekos.no/inspirasjon/isbading): Kaldbad og restitusjon.

## Valgfri

- [AI-surface overview](https://utekos.no/llms): Menneskelesbar oversikt over AI-endepunktene.
- [Full AI context](https://utekos.no/llms-full.txt): Utvidet kontekstfil for modeller som trenger mer produkt- og merkevaregrunnlag.`

export async function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control':
        'public, s-maxage=86400, stale-while-revalidate=86400'
    }
  })
}
