import { rawMagazineArticles } from '@/app/magasinet/data/magazineArticles'
import { validateMagazineArticles } from '@/app/magasinet/utils/validateMagazineArticles'
import { returnPolicyLlmsSummary } from '@/lib/policies/returnPolicy'
import {
  buildProductPresentationLlmsIndex,
  buildProductPresentationLlmsProfiles
} from '@/lib/products/presentation'

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

const productIndex = buildProductPresentationLlmsIndex()
const productProfiles = buildProductPresentationLlmsProfiles()

const body = `# Utekos

Denne filen er Utekos sin utvidede, valgfrie kontekstflate for maskinlesere. Den erstatter ikke HTML, produktsider, søkemotorers crawlerregler eller strukturerte data.

## Kilde- og ferskhetsregler

- Produktsidene er kanoniske for gjeldende pris, kjøpsstatus, lager og synlige varianter.
- Produktnavn, offentlige URL-er, beskrivelser, materiale og målgruppe nedenfor genereres fra samme Utekos-eide presentasjonsregister som metadata, sitemap og produktfeeder.
- Shopify leverer commerce-identitet, pris, lager, SKU og GTIN, men Shopify-handle, rå tittel og rå varianttittel er ikke offentlige presentasjonskilder.
- Denne filen hardkoder derfor ikke pris, lager, SKU eller en varianttabell som kan drive fra storefronten.

## Merkevaresammendrag

Utekos utvikler produkter for utendørs komfort i nordiske forhold. Produktene skal gjøre det enklere å forlenge tiden ute på terrasse, hytte, båt og bobil, med tydelig vekt på varme, fleksibel bruk og dokumenterbare materialegenskaper.

## Kanoniske produkter

${productIndex}

## Produktprofiler

${productProfiles}

## Landingsside for Utekos TechDown™

- [Skreddersy varmen](https://utekos.no/skreddersy-varmen): Primær annonse- og innholdslandingsside for Utekos TechDown™.
- [Funksjonalitet](https://utekos.no/handlehjelp/funksjonalitet): Forklaring av 3-i-1-bruk.
- [Teknologi og materialer](https://utekos.no/handlehjelp/teknologi-materialer): Dybdeinnhold om materialer og konstruksjon.
- [Størrelsesguide](https://utekos.no/handlehjelp/storrelsesguide): Hjelp til valg av størrelse.

## Frakt, retur og tillit

- [Frakt, retur og refusjon](https://utekos.no/frakt-og-retur): ${returnPolicyLlmsSummary}
- [Kontakt oss](https://utekos.no/kontaktskjema): Kundeservice og henvendelser.
- [Personvern](https://utekos.no/personvern): Behandling av personopplysninger.
- [Vilkår og betingelser](https://utekos.no/vilkar-betingelser): Kjøpsvilkår.
- [Om Utekos®](https://utekos.no/om-oss): Merkevare og bakgrunn.

## Redaksjonelt innhold

- [Magasinet](https://utekos.no/magasinet): Hovedinngang til redaksjonelt innhold.
${magazineArticleLines}

- [Inspirasjon](https://utekos.no/inspirasjon): Temasider for bruksscenarier.
- [Hytteliv](https://utekos.no/inspirasjon/hytteliv)
- [Bobilliv](https://utekos.no/inspirasjon/bobil)
- [Båtliv](https://utekos.no/inspirasjon/batliv)
- [Terrassen](https://utekos.no/inspirasjon/terrassen)

## Relaterte maskinlesbare flater

- [Kort indeks](https://utekos.no/llms.txt)
- [Menneskelesbar oversikt](https://utekos.no/llms)
`

export async function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control':
        'public, s-maxage=86400, stale-while-revalidate=86400'
    }
  })
}
